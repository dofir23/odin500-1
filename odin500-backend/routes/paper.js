// Paper trading API — auth: middleware/authMiddleware requireAuthStrict (same as watchlists).
// Mount: index.js → app.use('/api/paper', paperRoutes)

const express = require('express');
const router = express.Router();
const { requireAuthStrict } = require('../middleware/authMiddleware');
const supabaseService = require('../config/supabaseService');
const {
  getOrCreateAccount,
  placeOrder,
  cancelOrderForUser,
  STARTING_CAPITAL
} = require('../services/paper/orderEngine');
const { enrichPositionsWithPnl, calcEquity } = require('../services/paper/pnlCalculator');

router.use(requireAuthStrict);

router.get('/account', async (req, res) => {
  try {
    const userId = req.user.id;
    const account = await getOrCreateAccount(userId);

    const { data: positions, error: posErr } = await supabaseService
      .from('paper_positions')
      .select('*')
      .eq('account_id', account.id)
      .neq('qty', 0);

    if (posErr) throw posErr;

    const enriched = await enrichPositionsWithPnl(positions || []);
    const equity = calcEquity(account, enriched);
    const starting = Number(account.starting_capital) || STARTING_CAPITAL;
    const totalReturn = Math.round((equity - starting) * 100) / 100;
    const totalReturnPct =
      starting > 0 ? Math.round((totalReturn / starting) * 10000) / 100 : 0;

    res.status(200).json({
      ...account,
      equity,
      buying_power: Number(account.cash_balance),
      total_return: totalReturn,
      total_return_pct: totalReturnPct,
      positions_count: enriched.length,
      positions: enriched
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/orders', async (req, res) => {
  try {
    const result = await placeOrder(req.user.id, req.body);
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
    const order = await cancelOrderForUser(req.user.id, req.params.id);
    res.status(200).json(order);
  } catch (error) {
    const status = error.message === 'Order not found' ? 404 : 400;
    res.status(status).json({ error: error.message });
  }
});

router.get('/orders', async (req, res) => {
  try {
    const account = await getOrCreateAccount(req.user.id);
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
    const account = await getOrCreateAccount(req.user.id);
    const { data, error } = await supabaseService
      .from('paper_positions')
      .select('*')
      .eq('account_id', account.id)
      .neq('qty', 0);

    if (error) throw error;
    const positions = await enrichPositionsWithPnl(data || []);
    res.status(200).json({ positions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/portfolio/history', async (req, res) => {
  try {
    const account = await getOrCreateAccount(req.user.id);
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
    const account = await getOrCreateAccount(req.user.id);
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

router.post('/account/reset', async (req, res) => {
  try {
    const account = await getOrCreateAccount(req.user.id);

    await supabaseService
      .from('paper_orders')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('account_id', account.id)
      .eq('status', 'pending');

    await supabaseService.from('paper_positions').delete().eq('account_id', account.id);

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
