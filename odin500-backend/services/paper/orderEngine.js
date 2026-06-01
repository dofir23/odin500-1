// Core paper order flow.
// Supabase: config/supabaseService.js | Auth user id from routes (req.user.id).

const supabaseService = require('../../config/supabaseService');
const { simulateFill } = require('./executionSimulator');
const { validateOrder } = require('./riskGuard');
const { applyFill } = require('./positionManager');
const { getCurrentPrice } = require('./pnlCalculator');

const { DEFAULT_ACCOUNT_NAME, STARTING_CAPITAL } = require('./dbSchema');

async function getOrCreateAccount(userId) {
  const { data: existing, error: selErr } = await supabaseService
    .from('paper_accounts')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (selErr) throw selErr;
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

/**
 * @param {string} accountId
 * @param {object} order
 * @param {{ fillPrice: number, fillQty: number, slippage: number }} fill
 * @param {number} marketPrice
 */
async function executeFill(accountId, order, fill, marketPrice) {
  const now = new Date().toISOString();

  const { error: fillErr } = await supabaseService.from('paper_fills').insert({
    order_id: order.id,
    account_id: accountId,
    ticker: String(order.ticker || '').toUpperCase(),
    side: order.side,
    qty: fill.fillQty,
    fill_price: fill.fillPrice,
    market_price_at_fill: marketPrice,
    filled_at: now
  });
  if (fillErr) throw fillErr;

  const { data: updatedOrder, error: ordErr } = await supabaseService
    .from('paper_orders')
    .update({
      status: 'filled',
      filled_qty: fill.fillQty,
      avg_fill_price: fill.fillPrice,
      filled_at: now
    })
    .eq('id', order.id)
    .select('*')
    .single();

  if (ordErr) throw ordErr;

  await applyFill(accountId, order, fill);

  return { order: updatedOrder, fill, marketPrice };
}

/**
 * @param {string} userId
 * @param {{ ticker: string, side: string, qty: number, orderType?: string, limitPrice?: number, stopPrice?: number }} orderInput
 */
async function placeOrder(userId, orderInput) {
  const account = await getOrCreateAccount(userId);
  const ticker = String(orderInput.ticker || '').trim().toUpperCase();
  const side = String(orderInput.side || 'buy').toLowerCase();
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
  validateOrder({ ticker, side, qty, orderType }, account, priceForRisk);

  if (side === 'sell') {
    const { data: pos, error: posErr } = await supabaseService
      .from('paper_positions')
      .select('qty')
      .eq('account_id', account.id)
      .eq('ticker', ticker)
      .maybeSingle();
    if (posErr) throw posErr;
    const held = Number(pos?.qty || 0);
    if (held < qty) {
      throw new Error(`Insufficient shares: you hold ${held} ${ticker}`);
    }
  }

  const { data: order, error: insErr } = await supabaseService
    .from('paper_orders')
    .insert({
      account_id: account.id,
      ticker,
      side,
      qty,
      order_type: orderType,
      limit_price: limitPrice,
      stop_price: stopPrice,
      status: 'pending'
    })
    .select('*')
    .single();

  if (insErr) throw insErr;

  if (orderType === 'market' || !orderType) {
    const fill = simulateFill(side, qty, marketPrice);
    const result = await executeFill(account.id, order, fill, marketPrice);
    return { account, ...result };
  }

  return { account, order, pending: true };
}

async function cancelOrderForUser(userId, orderId) {
  const account = await getOrCreateAccount(userId);
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
  placeOrder,
  executeFill,
  cancelOrderForUser,
  STARTING_CAPITAL
};
