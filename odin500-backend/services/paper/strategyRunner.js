const supabaseService = require('../../config/supabaseService');
const { getCurrentPrice } = require('./pnlCalculator');
const { placeOrder } = require('./orderEngine');
const {
  getLatestSignalBucket,
  normalizeSignalBucket,
  signalSideFromBucket,
  VALID_BUCKETS
} = require('./latestSignal');

/** Min ms between repeat triggers for the same rule on the same account. */
const RULE_COOLDOWN_MS = Number(process.env.PAPER_STRATEGY_RULE_COOLDOWN_MS || 15 * 60 * 1000);

const BINDING_SELECT =
  '*, paper_strategies!inner(*, paper_strategy_rules(*))';

function normalizeAction(action) {
  const a = String(action || '').toUpperCase();
  return ['BTO', 'STO', 'BTC', 'STC'].includes(a) ? a : 'BTO';
}

function parseParams(rule) {
  const p = rule?.params;
  if (p && typeof p === 'object' && !Array.isArray(p)) return p;
  return {};
}

async function wasRuleTriggeredRecently(accountId, ruleId) {
  if (!RULE_COOLDOWN_MS || RULE_COOLDOWN_MS <= 0) return false;
  const since = new Date(Date.now() - RULE_COOLDOWN_MS).toISOString();
  const { data, error } = await supabaseService
    .from('paper_strategy_execution_log')
    .select('id')
    .eq('account_id', accountId)
    .eq('rule_id', ruleId)
    .eq('status', 'triggered')
    .gte('ran_at', since)
    .limit(1);
  if (error) return false;
  return (data || []).length > 0;
}

async function evaluateRule(rule) {
  const ticker = String(rule.ticker || '').toUpperCase().trim();
  const type = String(rule.rule_type || '').toLowerCase();
  const params = parseParams(rule);

  if (type === 'signal_side' || type === 'signal_bucket') {
    const bucket = await getLatestSignalBucket(ticker);
    if (bucket == null) {
      return { shouldTrade: false, message: `No signal for ${ticker}` };
    }
    if (type === 'signal_bucket') {
      const want = String(params.bucket || rule.threshold_value || '')
        .trim()
        .toUpperCase();
      const normalizedWant = VALID_BUCKETS.has(want) ? want : normalizeSignalBucket(want);
      return {
        shouldTrade: normalizedWant === bucket,
        price: null,
        signalBucket: bucket
      };
    }
    const wantSide = String(params.side || '')
      .trim()
      .toLowerCase();
    const side = signalSideFromBucket(bucket);
    return {
      shouldTrade: wantSide === side,
      price: null,
      signalBucket: bucket
    };
  }

  const price = await getCurrentPrice(ticker);
  if (price == null) return { shouldTrade: false, message: `No price for ${ticker}` };
  const threshold = Number(rule.threshold_value);

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

function rulesFromBinding(binding) {
  const strategy = binding.paper_strategies;
  if (!strategy) return { strategy: null, rules: [] };
  const rules = (strategy.paper_strategy_rules || []).filter((r) => r.is_active !== false);
  return { strategy, rules };
}

async function processBinding(binding) {
  const { strategy, rules } = rulesFromBinding(binding);
  if (!strategy || strategy.is_active === false) {
    return { triggered: 0, failed: 0 };
  }

  let triggered = 0;
  let failed = 0;

  for (const rule of rules) {
    try {
      if (await wasRuleTriggeredRecently(binding.account_id, rule.id)) {
        await supabaseService.from('paper_strategy_execution_log').insert({
          strategy_id: strategy.id,
          account_id: binding.account_id,
          rule_id: rule.id,
          status: 'skipped',
          message: 'Cooldown — rule already triggered recently'
        });
        continue;
      }

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
        metadata: {
          strategy_id: strategy.id,
          rule_id: rule.id,
          triggered_price: evalOut.price,
          signal_bucket: evalOut.signalBucket || null
        }
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
    .update({
      last_run_at: new Date().toISOString(),
      last_error: failed > 0 ? 'See execution log' : null
    })
    .eq('id', binding.id);

  return { triggered, failed };
}

async function loadActiveBindings(accountIdFilter) {
  let q = supabaseService
    .from('paper_strategy_account_bindings')
    .select(BINDING_SELECT)
    .eq('is_active', true);

  if (accountIdFilter) {
    q = q.eq('account_id', accountIdFilter);
  }

  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

async function runStrategiesOnce() {
  const bindings = await loadActiveBindings(null);
  let triggered = 0;
  let failed = 0;
  for (const binding of bindings) {
    const out = await processBinding(binding);
    triggered += out.triggered;
    failed += out.failed;
  }
  return { triggered, failed };
}

/**
 * @param {string} accountId
 */
async function runStrategiesForAccount(accountId) {
  const bindings = await loadActiveBindings(accountId);
  let triggered = 0;
  let failed = 0;
  for (const binding of bindings) {
    const out = await processBinding(binding);
    triggered += out.triggered;
    failed += out.failed;
  }
  return { triggered, failed };
}

module.exports = { runStrategiesOnce, runStrategiesForAccount, evaluateRule };
