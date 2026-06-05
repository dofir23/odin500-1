const supabaseService = require('../../config/supabaseService');
const { getCurrentPrice } = require('./pnlCalculator');
const { placeOrder } = require('./orderEngine');
const { getClosableQty } = require('./positionManager');
const {
  getLatestSignalBucket,
  normalizeSignalBucket,
  signalSideFromBucket,
  VALID_BUCKETS
} = require('./latestSignal');

const BINDING_SELECT =
  '*, paper_strategies!inner(*, paper_strategy_rules(*))';

function normalizeAction(action) {
  const a = String(action || '').toUpperCase();
  return ['BTO', 'STO', 'BTC', 'STC'].includes(a) ? a : 'BTO';
}

function isOpeningAction(action) {
  const a = normalizeAction(action);
  return a === 'BTO' || a === 'STO';
}

function isClosingAction(action) {
  const a = normalizeAction(action);
  return a === 'STC' || a === 'BTC';
}

function parseParams(rule) {
  const p = rule?.params;
  if (p && typeof p === 'object' && !Array.isArray(p)) return p;
  return {};
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

/**
 * One order per open position cycle: opens only when flat on that side; closes only when lots exist.
 * @returns {{ ok: true, qty: number, action: string } | { ok: false, skipMessage: string }}
 */
function resolveOrderFromRule(rule, position) {
  const action = normalizeAction(rule.action);
  const ruleQty = Number(rule.qty || 0);
  if (!Number.isFinite(ruleQty) || ruleQty <= 0) {
    return { ok: false, skipMessage: 'Invalid rule quantity' };
  }

  const longQty = Number(position?.closableLongQty || 0);
  const shortQty = Number(position?.closableShortQty || 0);

  if (action === 'BTO') {
    if (longQty > 0) {
      return { ok: false, skipMessage: 'Already in long position — entry skipped' };
    }
    return { ok: true, qty: ruleQty, action };
  }

  if (action === 'STO') {
    if (shortQty > 0) {
      return { ok: false, skipMessage: 'Already in short position — entry skipped' };
    }
    return { ok: true, qty: ruleQty, action };
  }

  if (action === 'STC') {
    if (longQty <= 0) {
      return { ok: false, skipMessage: 'No long position to close' };
    }
    return { ok: true, qty: Math.min(ruleQty, longQty), action };
  }

  if (action === 'BTC') {
    if (shortQty <= 0) {
      return { ok: false, skipMessage: 'No short position to close' };
    }
    return { ok: true, qty: Math.min(ruleQty, shortQty), action };
  }

  return { ok: false, skipMessage: `Unsupported action ${action}` };
}

function rulesFromBinding(binding) {
  const strategy = binding.paper_strategies;
  if (!strategy) return { strategy: null, rules: [] };
  const rules = (strategy.paper_strategy_rules || []).filter((r) => r.is_active !== false);
  return { strategy, rules };
}

async function loadPositionsForRules(accountId, rules) {
  const tickers = [
    ...new Set(
      rules.map((r) => String(r.ticker || '').toUpperCase().trim()).filter(Boolean)
    )
  ];
  const cache = new Map();
  await Promise.all(
    tickers.map(async (ticker) => {
      cache.set(ticker, await getClosableQty(accountId, ticker));
    })
  );
  return cache;
}

async function logStrategyEvent({ strategyId, accountId, ruleId, status, message, orderId = null }) {
  await supabaseService.from('paper_strategy_execution_log').insert({
    strategy_id: strategyId,
    account_id: accountId,
    rule_id: ruleId,
    status,
    message,
    order_id: orderId
  });
}

async function processBinding(binding) {
  const { strategy, rules } = rulesFromBinding(binding);
  if (!strategy || strategy.is_active === false) {
    return { triggered: 0, failed: 0 };
  }

  const positionByTicker = await loadPositionsForRules(binding.account_id, rules);

  let triggered = 0;
  let failed = 0;

  for (const rule of rules) {
    try {
      const evalOut = await evaluateRule(rule);
      if (!evalOut.shouldTrade) continue;

      const ticker = String(rule.ticker || '').toUpperCase().trim();
      const position = positionByTicker.get(ticker) || {
        closableLongQty: 0,
        closableShortQty: 0
      };

      const resolved = resolveOrderFromRule(rule, position);
      if (!resolved.ok) {
        await logStrategyEvent({
          strategyId: strategy.id,
          accountId: binding.account_id,
          ruleId: rule.id,
          status: 'skipped',
          message: resolved.skipMessage
        });
        continue;
      }

      const result = await placeOrder(strategy.user_id, {
        account_id: binding.account_id,
        ticker: rule.ticker,
        action: resolved.action,
        qty: resolved.qty,
        orderType: 'market',
        source: 'strategy',
        metadata: {
          strategy_id: strategy.id,
          rule_id: rule.id,
          triggered_price: evalOut.price,
          signal_bucket: evalOut.signalBucket || null
        }
      });

      // Refresh cached position so later rules in the same run see updated lots.
      positionByTicker.set(ticker, await getClosableQty(binding.account_id, ticker));

      await logStrategyEvent({
        strategyId: strategy.id,
        accountId: binding.account_id,
        ruleId: rule.id,
        status: 'triggered',
        message: 'Order submitted',
        orderId: result?.order?.id || null
      });
      triggered += 1;
    } catch (e) {
      failed += 1;
      await logStrategyEvent({
        strategyId: strategy.id,
        accountId: binding.account_id,
        ruleId: rule.id,
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

module.exports = {
  runStrategiesOnce,
  runStrategiesForAccount,
  evaluateRule,
  resolveOrderFromRule,
  isOpeningAction,
  isClosingAction
};
