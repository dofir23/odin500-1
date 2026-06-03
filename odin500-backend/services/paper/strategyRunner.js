const supabaseService = require('../../config/supabaseService');
const { getCurrentPrice } = require('./pnlCalculator');
const { placeOrder } = require('./orderEngine');

function normalizeAction(action) {
  const a = String(action || '').toUpperCase();
  return ['BTO', 'STO', 'BTC', 'STC'].includes(a) ? a : 'BTO';
}

async function evaluateRule(rule) {
  const ticker = String(rule.ticker || '').toUpperCase().trim();
  const price = await getCurrentPrice(ticker);
  if (price == null) return { shouldTrade: false, message: `No price for ${ticker}` };
  const threshold = Number(rule.threshold_value);
  const type = String(rule.rule_type || '').toLowerCase();
  if (type === 'price_above') {
    return { shouldTrade: Number.isFinite(threshold) ? price >= threshold : false, price };
  }
  if (type === 'price_below') {
    return { shouldTrade: Number.isFinite(threshold) ? price <= threshold : false, price };
  }
  if (type === 'always') {
    return { shouldTrade: true, price };
  }
  return { shouldTrade: false, message: `Unsupported rule_type ${rule.rule_type}` };
}

async function runStrategiesOnce() {
  const { data: bindings, error } = await supabaseService
    .from('paper_strategy_account_bindings')
    .select('*, paper_strategies(*), paper_strategy_rules(*)')
    .eq('is_active', true);
  if (error) throw error;

  let triggered = 0;
  let failed = 0;
  for (const binding of bindings || []) {
    const strategy = binding.paper_strategies;
    if (!strategy || strategy.is_active === false) continue;
    const rules = (binding.paper_strategy_rules || []).filter((r) => r.is_active !== false);
    for (const rule of rules) {
      try {
        const evalOut = await evaluateRule(rule);
        if (!evalOut.shouldTrade) continue;
        const qty = Number(rule.qty || 0);
        if (!Number.isFinite(qty) || qty <= 0) continue;
        const result = await placeOrder(strategy.user_id, {
          account_id: binding.account_id,
          ticker: rule.ticker,
          action: normalizeAction(rule.action),
          qty,
          orderType: 'market',
          source: 'strategy',
          metadata: { strategy_id: strategy.id, rule_id: rule.id, triggered_price: evalOut.price }
        });
        await supabaseService.from('paper_strategy_execution_log').insert({
          strategy_id: strategy.id,
          account_id: binding.account_id,
          rule_id: rule.id,
          status: 'triggered',
          message: 'Order submitted',
          order_id: result?.order?.id || null
        });
        triggered += 1;
      } catch (e) {
        failed += 1;
        await supabaseService.from('paper_strategy_execution_log').insert({
          strategy_id: strategy.id,
          account_id: binding.account_id,
          rule_id: rule.id,
          status: 'failed',
          message: e.message || String(e)
        });
      }
    }
    await supabaseService
      .from('paper_strategy_account_bindings')
      .update({ last_run_at: new Date().toISOString(), last_error: failed > 0 ? 'See execution log' : null })
      .eq('id', binding.id);
  }
  return { triggered, failed };
}

module.exports = { runStrategiesOnce };

