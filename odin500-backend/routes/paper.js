// Paper trading API — auth: middleware/authMiddleware requireAuthStrict (same as watchlists).
// Mount: index.js → app.use('/api/paper', paperRoutes)

const express = require('express');
const router = express.Router();
const { requireAuthStrict } = require('../middleware/authMiddleware');
const supabaseService = require('../config/supabaseService');
const {
  getOrCreateAccount,
  resolveAccountForUser,
  listAccountsForUser,
  createAccountForUser,
  deleteAccountForUser,
  placeOrder,
  cancelOrderForUser,
  STARTING_CAPITAL
} = require('../services/paper/orderEngine');
const {
  enrichLotsWithPnl,
  aggregateLotsToPositions,
  summarizeAccountMetrics
} = require('../services/paper/pnlCalculator');

router.use(requireAuthStrict);

async function loadActiveAccount(userId, req) {
  const accountId = req.query.account_id || req.query.accountId || req.body?.account_id || req.body?.accountId;
  return resolveAccountForUser(userId, accountId);
}

router.get('/accounts', async (req, res) => {
  try {
    const accounts = await listAccountsForUser(req.user.id);
    res.status(200).json({ accounts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/accounts', async (req, res) => {
  try {
    const account = await createAccountForUser(req.user.id, req.body || {});
    res.status(201).json(account);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/accounts/:id', async (req, res) => {
  try {
    const result = await deleteAccountForUser(req.user.id, req.params.id);
    res.status(200).json(result);
  } catch (error) {
    const msg = error.message || 'Delete failed';
    const status = msg.includes('not found') ? 404 : 500;
    res.status(status).json({ error: msg });
  }
});

router.get('/account', async (req, res) => {
  try {
    const userId = req.user.id;
    const account = await loadActiveAccount(userId, req);
    const { data: lots, error: lotErr } = await supabaseService
      .from('paper_position_lots')
      .select('*')
      .eq('account_id', account.id)
      .eq('status', 'open')
      .gt('remaining_qty', 0);
    if (lotErr) throw lotErr;

    const { data: closedTrades, error: closeErr } = await supabaseService
      .from('paper_trades_closed')
      .select('*')
      .eq('account_id', account.id)
      .order('closed_at', { ascending: false })
      .limit(500);
    if (closeErr) throw closeErr;

    const enrichedLots = await enrichLotsWithPnl(lots || []);
    const positions = aggregateLotsToPositions(enrichedLots);
    const metrics = summarizeAccountMetrics(account, positions, closedTrades || []);

    res.status(200).json({
      ...account,
      ...metrics,
      positions_count: positions.length,
      positions
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/orders', async (req, res) => {
  try {
    const result = await placeOrder(req.user.id, req.body || {});
    res.status(201).json(result);
  } catch (error) {
    const msg = error.message || 'Order failed';
    const status =
      msg.includes('Insufficient') || msg.includes('required') || msg.includes('exceed')
        ? 400
        : 500;
    res.status(status).json({ error: msg });
  }
});

router.delete('/orders/:id', async (req, res) => {
  try {
    const order = await cancelOrderForUser(
      req.user.id,
      req.params.id,
      req.query.account_id || req.query.accountId || null
    );
    res.status(200).json(order);
  } catch (error) {
    const status = error.message === 'Order not found' ? 404 : 400;
    res.status(status).json({ error: error.message });
  }
});

router.get('/orders', async (req, res) => {
  try {
    const account = await loadActiveAccount(req.user.id, req);
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const { data, error } = await supabaseService
      .from('paper_orders')
      .select('*')
      .eq('account_id', account.id)
      .order('submitted_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    res.status(200).json({ orders: data || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/positions', async (req, res) => {
  try {
    const account = await loadActiveAccount(req.user.id, req);
    const { data, error } = await supabaseService
      .from('paper_position_lots')
      .select('*')
      .eq('account_id', account.id)
      .eq('status', 'open')
      .gt('remaining_qty', 0);

    if (error) throw error;
    const enrichedLots = await enrichLotsWithPnl(data || []);
    const positions = aggregateLotsToPositions(enrichedLots);
    res.status(200).json({ positions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/portfolio/history', async (req, res) => {
  try {
    const account = await loadActiveAccount(req.user.id, req);
    const { data, error } = await supabaseService
      .from('paper_portfolio_snapshots')
      .select('snapshot_at, equity, cash')
      .eq('account_id', account.id)
      .order('snapshot_at', { ascending: true })
      .limit(500);

    if (error) throw error;
    const history = (data || []).map((row) => ({
      snapshot_at: row.snapshot_at,
      equity: row.equity,
      cash_balance: row.cash
    }));
    res.status(200).json({ history });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/trades', async (req, res) => {
  try {
    const account = await loadActiveAccount(req.user.id, req);
    const { data, error } = await supabaseService
      .from('paper_fills')
      .select('*')
      .eq('account_id', account.id)
      .order('filled_at', { ascending: false })
      .limit(200);

    if (error) throw error;
    res.status(200).json({ trades: data || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/trades/closed', async (req, res) => {
  try {
    const account = await loadActiveAccount(req.user.id, req);
    const { data, error } = await supabaseService
      .from('paper_trades_closed')
      .select('*')
      .eq('account_id', account.id)
      .order('closed_at', { ascending: false })
      .limit(500);
    if (error) throw error;
    const totals = (data || []).reduce(
      (acc, row) => {
        acc.realized += Number(row.net_realized_pnl || 0);
        acc.gross += Number(row.gross_realized_pnl || 0);
        return acc;
      },
      { realized: 0, gross: 0 }
    );
    res.status(200).json({
      trades: data || [],
      totals: {
        gross_realized_pnl: Math.round(totals.gross * 100) / 100,
        net_realized_pnl: Math.round(totals.realized * 100) / 100
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/strategies', async (req, res) => {
  try {
    const { data, error } = await supabaseService
      .from('paper_strategies')
      .select('*, paper_strategy_rules(*), paper_strategy_account_bindings(*)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.status(200).json({ strategies: data || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/strategies', async (req, res) => {
  try {
    const payload = req.body || {};
    const { data, error } = await supabaseService
      .from('paper_strategies')
      .insert({
        user_id: req.user.id,
        name: String(payload.name || '').trim() || 'Untitled Strategy',
        strategy_key: String(payload.strategy_key || 'rule-based'),
        description: payload.description || null,
        is_active: payload.is_active !== false
      })
      .select('*')
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/strategies/:id/rules', async (req, res) => {
  try {
    const strategyId = req.params.id;
    const payload = req.body || {};
    const { data: strategy, error: sErr } = await supabaseService
      .from('paper_strategies')
      .select('id, user_id')
      .eq('id', strategyId)
      .eq('user_id', req.user.id)
      .maybeSingle();
    if (sErr) throw sErr;
    if (!strategy) return res.status(404).json({ error: 'Strategy not found' });
    const { data, error } = await supabaseService
      .from('paper_strategy_rules')
      .insert({
        strategy_id: strategyId,
        rule_type: String(payload.rule_type || 'always'),
        ticker: String(payload.ticker || '').toUpperCase(),
        action: String(payload.action || 'BTO').toUpperCase(),
        qty: Number(payload.qty || 0),
        threshold_value: payload.threshold_value != null ? Number(payload.threshold_value) : null,
        params: payload.params || {},
        is_active: payload.is_active !== false
      })
      .select('*')
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/strategies/:id/bindings', async (req, res) => {
  try {
    const strategyId = req.params.id;
    const account = await loadActiveAccount(req.user.id, req);
    const { data: strategy, error: sErr } = await supabaseService
      .from('paper_strategies')
      .select('id')
      .eq('id', strategyId)
      .eq('user_id', req.user.id)
      .maybeSingle();
    if (sErr) throw sErr;
    if (!strategy) return res.status(404).json({ error: 'Strategy not found' });
    const { data, error } = await supabaseService
      .from('paper_strategy_account_bindings')
      .upsert({
        strategy_id: strategyId,
        account_id: account.id,
        is_active: req.body?.is_active !== false
      })
      .select('*')
      .single();
    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/account/reset', async (req, res) => {
  try {
    const account = await loadActiveAccount(req.user.id, req);

    await supabaseService
      .from('paper_orders')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('account_id', account.id)
      .eq('status', 'pending');

    await supabaseService.from('paper_positions').delete().eq('account_id', account.id);
    await supabaseService.from('paper_position_lots').delete().eq('account_id', account.id);
    await supabaseService.from('paper_lot_closures').delete().eq('account_id', account.id);
    await supabaseService.from('paper_trades_closed').delete().eq('account_id', account.id);

    const resetPayload = { cash_balance: STARTING_CAPITAL };
    if (account.starting_capital != null) {
      resetPayload.starting_capital = STARTING_CAPITAL;
    }
    const { data: updated, error } = await supabaseService
      .from('paper_accounts')
      .update(resetPayload)
      .eq('id', account.id)
      .select('*')
      .single();

    if (error) throw error;
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
