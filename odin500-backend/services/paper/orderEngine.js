// Core paper order flow.
// Supabase: config/supabaseService.js | Auth user id from routes (req.user.id).

const supabaseService = require('../../config/supabaseService');
const { simulateFill } = require('./executionSimulator');
const { validateOrder } = require('./riskGuard');
const { applyFill, getClosableQty } = require('./positionManager');
const { getCurrentPrice } = require('./pnlCalculator');

const { DEFAULT_ACCOUNT_NAME, STARTING_CAPITAL } = require('./dbSchema');

async function getOrCreateAccount(userId) {
  const { data: rows, error: selErr } = await supabaseService
    .from('paper_accounts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1);

  if (selErr) throw selErr;
  const existing = rows?.[0];
  if (existing) return existing;

  const { data: created, error: insErr } = await supabaseService
    .from('paper_accounts')
    .insert({
      user_id: userId,
      name: DEFAULT_ACCOUNT_NAME,
      cash_balance: STARTING_CAPITAL
    })
    .select('*')
    .single();

  if (insErr) throw insErr;
  return created;
}

async function resolveAccountForUser(userId, explicitAccountId) {
  if (!explicitAccountId) return getOrCreateAccount(userId);
  const { data, error } = await supabaseService
    .from('paper_accounts')
    .select('*')
    .eq('id', explicitAccountId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Paper account not found');
  return data;
}

async function listAccountsForUser(userId) {
  const { data, error } = await supabaseService
    .from('paper_accounts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

async function createAccountForUser(userId, payload = {}) {
  const name = String(payload.name || '').trim() || `Paper Account ${new Date().toISOString().slice(0, 10)}`;
  const starting = Number(payload.starting_capital);
  const capital = Number.isFinite(starting) && starting > 0 ? starting : STARTING_CAPITAL;
  const { data, error } = await supabaseService
    .from('paper_accounts')
    .insert({
      user_id: userId,
      name,
      cash_balance: capital,
      starting_capital: capital
    })
    .select('*')
    .single();
  if (error) {
    if (String(error.message || '').includes('paper_accounts_user_id_key')) {
      throw new Error(
        'Database still allows only one paper account per user. Run supabase/manual/paper_accounts_allow_multi_per_user.sql in Supabase, then reload schema cache.'
      );
    }
    if (String(error.message || '').includes('uq_paper_accounts_user_name')) {
      throw new Error('You already have a paper account with that name.');
    }
    throw error;
  }
  return data;
}

function normalizeAction(rawAction, rawSide = '') {
  const act = String(rawAction || '').toUpperCase().trim();
  if (['BTO', 'STO', 'BTC', 'STC'].includes(act)) return act;
  const side = String(rawSide || '').toLowerCase().trim();
  if (side === 'buy') return 'BTO';
  if (side === 'sell') return 'STC';
  return 'BTO';
}

function actionToLegacySide(action) {
  return action === 'BTO' || action === 'BTC' ? 'buy' : 'sell';
}

/**
 * @param {string} accountId
 * @param {object} order
 * @param {{ fillPrice: number, fillQty: number, slippage: number }} fill
 * @param {number} marketPrice
 */
async function executeFill(accountId, order, fill, marketPrice) {
  const now = new Date().toISOString();
  const { data: fillRow, error: fillErr } = await supabaseService
    .from('paper_fills')
    .insert({
    order_id: order.id,
    account_id: accountId,
    ticker: String(order.ticker || '').toUpperCase(),
    side: order.side || actionToLegacySide(order.action),
    action: order.action,
    qty: fill.fillQty,
    fill_price: fill.fillPrice,
    market_price_at_fill: marketPrice,
    commission: fill.commission || 0,
    exchange_fee: fill.exchangeFee || 0,
    regulatory_fee: fill.regulatoryFee || 0,
    slippage_amount: fill.slippage || 0,
    total_fees: fill.totalFees || 0,
    filled_at: now
    })
    .select('*')
    .single();
  if (fillErr) throw fillErr;

  const { data: updatedOrder, error: ordErr } = await supabaseService
    .from('paper_orders')
    .update({
      status: 'filled',
      filled_qty: fill.fillQty,
      avg_fill_price: fill.fillPrice,
      action: order.action,
      commission: fill.commission || 0,
      exchange_fee: fill.exchangeFee || 0,
      regulatory_fee: fill.regulatoryFee || 0,
      slippage_amount: fill.slippage || 0,
      total_fees: fill.totalFees || 0,
      filled_at: now
    })
    .eq('id', order.id)
    .select('*')
    .single();

  if (ordErr) throw ordErr;

  await applyFill(accountId, order, { ...fill, fillId: fillRow?.id });

  return { order: updatedOrder, fill, marketPrice };
}

/**
 * @param {string} userId
 * @param {{ ticker: string, side: string, qty: number, orderType?: string, limitPrice?: number, stopPrice?: number }} orderInput
 */
async function placeOrder(userId, orderInput) {
  const account = await resolveAccountForUser(userId, orderInput.accountId || orderInput.account_id);
  const ticker = String(orderInput.ticker || '').trim().toUpperCase();
  const action = normalizeAction(orderInput.action, orderInput.side);
  const side = actionToLegacySide(action);
  const qty = Number(orderInput.qty);
  const orderType = String(orderInput.orderType || orderInput.order_type || 'market').toLowerCase();
  const limitPrice =
    orderInput.limitPrice != null
      ? Number(orderInput.limitPrice)
      : orderInput.limit_price != null
        ? Number(orderInput.limit_price)
        : null;
  const stopPrice =
    orderInput.stopPrice != null
      ? Number(orderInput.stopPrice)
      : orderInput.stop_price != null
        ? Number(orderInput.stop_price)
        : null;

  const marketPrice = await getCurrentPrice(ticker);
  if (marketPrice == null) {
    throw new Error(`No market price available for ${ticker}`);
  }

  const priceForRisk =
    orderType === 'limit' && limitPrice != null ? limitPrice : marketPrice;
  const closable = await getClosableQty(account.id, ticker);
  validateOrder({ ticker, action, qty, orderType }, account, priceForRisk, closable);

  const { data: order, error: insErr } = await supabaseService
    .from('paper_orders')
    .insert({
      account_id: account.id,
      ticker,
      side,
      action,
      qty,
      order_type: orderType,
      limit_price: limitPrice,
      stop_price: stopPrice,
      source: String(orderInput.source || 'manual'),
      metadata: orderInput.metadata || {},
      status: 'pending'
    })
    .select('*')
    .single();

  if (insErr) throw insErr;

  if (orderType === 'market' || !orderType) {
    const fill = simulateFill(action, qty, marketPrice);
    const result = await executeFill(account.id, order, fill, marketPrice);
    return { account, ...result };
  }

  return { account, order, pending: true };
}

/** Tables keyed by account_id; delete before removing paper_accounts row. */
const ACCOUNT_CHILD_TABLES = [
  'paper_strategy_execution_log',
  'paper_strategy_account_bindings',
  'paper_lot_closures',
  'paper_trades_closed',
  'paper_position_lots',
  'paper_fills',
  'paper_orders',
  'paper_positions',
  'paper_portfolio_snapshots',
  'paper_account_daily_snapshots'
];

async function deleteAccountChildRows(accountId) {
  for (const table of ACCOUNT_CHILD_TABLES) {
    const { error } = await supabaseService.from(table).delete().eq('account_id', accountId);
    if (error && !/relation|does not exist|schema cache/i.test(String(error.message || ''))) {
      console.warn(`[paper] delete ${table}:`, error.message);
    }
  }
}

async function deleteAccountForUser(userId, accountId) {
  const account = await resolveAccountForUser(userId, accountId);
  const id = account.id;

  await supabaseService
    .from('paper_orders')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('account_id', id)
    .eq('status', 'pending');

  await deleteAccountChildRows(id);

  const { error } = await supabaseService
    .from('paper_accounts')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
  return { success: true, id, name: account.name };
}

async function cancelOrderForUser(userId, orderId, explicitAccountId = null) {
  const account = await resolveAccountForUser(userId, explicitAccountId);
  const { data: order, error: selErr } = await supabaseService
    .from('paper_orders')
    .select('*')
    .eq('id', orderId)
    .eq('account_id', account.id)
    .maybeSingle();

  if (selErr) throw selErr;
  if (!order) throw new Error('Order not found');
  if (order.status !== 'pending') {
    throw new Error('Only pending orders can be cancelled');
  }

  const { data: updated, error: updErr } = await supabaseService
    .from('paper_orders')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString()
    })
    .eq('id', orderId)
    .select('*')
    .single();

  if (updErr) throw updErr;
  return updated;
}

module.exports = {
  getOrCreateAccount,
  resolveAccountForUser,
  listAccountsForUser,
  createAccountForUser,
  deleteAccountForUser,
  placeOrder,
  executeFill,
  cancelOrderForUser,
  STARTING_CAPITAL
};
