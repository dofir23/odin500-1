import {
  isClosingPaperAction,
  isOpeningPaperAction,
  paperActionLabel,
  PAPER_ACTION_OPTIONS
} from './paperActionLabels.js';

export const RULE_TYPE_OPTIONS = [
  { id: 'price_above', label: 'Price above' },
  { id: 'price_below', label: 'Price below' },
  { id: 'always', label: 'Always (every run)' },
  { id: 'signal_side_long', label: 'Odin signal: Long (L1–L3)' },
  { id: 'signal_side_short', label: 'Odin signal: Short (S1–S3)' },
  { id: 'signal_side_neutral', label: 'Odin signal: Neutral (N)' },
  { id: 'signal_bucket', label: 'Odin signal: Exact bucket' }
];

export const SIGNAL_BUCKETS = ['L1', 'L2', 'L3', 'S1', 'S2', 'S3', 'N'];
export const LONG_SIGNAL_BUCKETS = ['L1', 'L2', 'L3'];
export const SHORT_SIGNAL_BUCKETS = ['S1', 'S2', 'S3'];

function ruleIdentity(rule) {
  return rule?.id ?? rule?._localId ?? null;
}

function normalizeTickerSet(tickers) {
  return new Set(
    (tickers || []).map((t) => String(t || '').trim().toUpperCase()).filter(Boolean)
  );
}

/** Long buckets an entry (buy) rule fires on. */
export function longBucketsFromRule(rule) {
  const ui = apiRuleToUiType(rule);
  if (ui === 'signal_side_long') return new Set(LONG_SIGNAL_BUCKETS);
  if (ui === 'signal_bucket') {
    return new Set(parseRuleSignalBuckets(rule).filter((b) => LONG_SIGNAL_BUCKETS.includes(b)));
  }
  return new Set();
}

/** Short buckets an entry (short) rule fires on. */
export function shortBucketsFromRule(rule) {
  const ui = apiRuleToUiType(rule);
  if (ui === 'signal_side_short') return new Set(SHORT_SIGNAL_BUCKETS);
  if (ui === 'signal_bucket') {
    return new Set(parseRuleSignalBuckets(rule).filter((b) => SHORT_SIGNAL_BUCKETS.includes(b)));
  }
  return new Set();
}

export function normalizeSignalBucketCode(raw) {
  const s = String(raw || '')
    .trim()
    .toUpperCase();
  return SIGNAL_BUCKETS.includes(s) ? s : '';
}

/** @param {object} rule */
export function parseRuleSignalBuckets(rule) {
  if (apiRuleToUiType(rule) !== 'signal_bucket') return [];
  const params = rule?.params || {};
  const raw = Array.isArray(params.buckets)
    ? params.buckets
    : params.bucket != null && params.bucket !== ''
      ? [params.bucket]
      : [];
  return [...new Set(raw.map(normalizeSignalBucketCode).filter(Boolean))];
}

/**
 * Buckets already used by other exact-signal rules for the given ticker(s).
 * @param {object[]} rules
 * @param {string[]} tickers
 * @param {string|null} [excludeRuleId]
 */
export function getClaimedSignalBuckets(rules, tickers, excludeRuleId = null) {
  const tickerSet = normalizeTickerSet(tickers);
  if (!tickerSet.size) return new Set();

  const claimed = new Set();
  for (const rule of rules || []) {
    if (excludeRuleId != null && ruleIdentity(rule) === excludeRuleId) continue;
    const sym = ruleTickerKey(rule);
    if (!tickerSet.has(sym)) continue;
    for (const bucket of parseRuleSignalBuckets(rule)) {
      claimed.add(bucket);
    }
  }
  return claimed;
}

/**
 * Sell cannot reuse buy entry signals; cover cannot reuse short entry signals.
 * @returns {{ blockedRuleTypes: Set<string>, blockedBuckets: Set<string> }}
 */
export function getExitSignalRestrictions(rules, tickers, closeAction, excludeRuleId = null) {
  const action = String(closeAction || '').toUpperCase();
  const entryAction = action === 'STC' ? 'BTO' : action === 'BTC' ? 'STO' : null;
  const blockedRuleTypes = new Set();
  const blockedBuckets = new Set();
  if (!entryAction) return { blockedRuleTypes, blockedBuckets };

  const tickerSet = normalizeTickerSet(tickers);
  if (!tickerSet.size) return { blockedRuleTypes, blockedBuckets };

  let blockLongSideRule = false;
  let blockShortSideRule = false;

  for (const rule of rules || []) {
    if (excludeRuleId != null && ruleIdentity(rule) === excludeRuleId) continue;
    const sym = ruleTickerKey(rule);
    if (!tickerSet.has(sym)) continue;
    if (String(rule.action || '').toUpperCase() !== entryAction) continue;

    if (entryAction === 'BTO') {
      const longBuckets = longBucketsFromRule(rule);
      if (apiRuleToUiType(rule) === 'signal_side_long' || longBuckets.size > 0) {
        blockLongSideRule = true;
      }
      for (const b of longBuckets) blockedBuckets.add(b);
    } else if (entryAction === 'STO') {
      const shortBuckets = shortBucketsFromRule(rule);
      if (apiRuleToUiType(rule) === 'signal_side_short' || shortBuckets.size > 0) {
        blockShortSideRule = true;
      }
      for (const b of shortBuckets) blockedBuckets.add(b);
    }
  }

  if (action === 'STC' && blockLongSideRule) {
    blockedRuleTypes.add('signal_side_long');
  }
  if (action === 'BTC' && blockShortSideRule) {
    blockedRuleTypes.add('signal_side_short');
  }

  return { blockedRuleTypes, blockedBuckets };
}

/** Union of bucket + exit-restriction disables for the rule form. */
export function getDisabledSignalBuckets(rules, tickers, action, excludeRuleId = null) {
  const disabled = getClaimedSignalBuckets(rules, tickers, excludeRuleId);
  if (isClosingPaperAction(action)) {
    const { blockedBuckets } = getExitSignalRestrictions(rules, tickers, action, excludeRuleId);
    for (const b of blockedBuckets) disabled.add(b);
  }
  return disabled;
}

export function buildRuleTypeOptions(rules, tickers, action, excludeRuleId = null) {
  const { blockedRuleTypes } = isClosingPaperAction(action)
    ? getExitSignalRestrictions(rules, tickers, action, excludeRuleId)
    : { blockedRuleTypes: new Set() };

  const entryHint =
    String(action).toUpperCase() === 'STC'
      ? 'Already used by your Buy entry rule for this ticker'
      : String(action).toUpperCase() === 'BTC'
        ? 'Already used by your Short entry rule for this ticker'
        : 'Unavailable';

  return RULE_TYPE_OPTIONS.map((opt) => ({
    ...opt,
    disabled: blockedRuleTypes.has(opt.id),
    disabledTitle: blockedRuleTypes.has(opt.id) ? entryHint : undefined
  }));
}

/** Actions valid for a rule type (hidden options are omitted from the form). */
export function getAllowedActionsForRuleType(uiRuleType, signalBuckets = []) {
  const all = ['BTO', 'STO', 'STC', 'BTC'];
  const type = String(uiRuleType || 'always');

  if (type === 'signal_side_long') return ['BTO', 'STC'];
  if (type === 'signal_side_short') return ['STO', 'BTC'];
  if (type === 'signal_side_neutral') return ['STC', 'BTC'];

  if (type === 'signal_bucket') {
    const buckets = normalizeSignalBucketList(signalBuckets);
    if (!buckets.length) return all;
    const allowed = new Set();
    for (const b of buckets) {
      if (LONG_SIGNAL_BUCKETS.includes(b)) {
        allowed.add('BTO');
        allowed.add('STC');
      }
      if (SHORT_SIGNAL_BUCKETS.includes(b)) {
        allowed.add('STO');
        allowed.add('BTC');
      }
      if (b === 'N') {
        allowed.add('STC');
        allowed.add('BTC');
      }
    }
    return allowed.size ? [...allowed] : all;
  }

  return all;
}

export function defaultActionForRuleType(uiRuleType, signalBuckets = []) {
  const allowed = getAllowedActionsForRuleType(uiRuleType, signalBuckets);
  const preferred = {
    signal_side_long: 'BTO',
    signal_side_short: 'STO',
    signal_side_neutral: 'STC',
    signal_bucket: 'BTO'
  };
  const type = String(uiRuleType || 'always');
  const pick = preferred[type] || 'BTO';
  if (allowed.includes(pick)) return pick;
  return allowed[0] || 'BTO';
}

export function coalesceActionForRuleType(uiRuleType, signalBuckets, currentAction) {
  const action = String(currentAction || 'BTO').toUpperCase();
  const allowed = getAllowedActionsForRuleType(uiRuleType, signalBuckets);
  if (allowed.includes(action)) return action;
  return defaultActionForRuleType(uiRuleType, signalBuckets);
}

export function buildActionOptions(uiRuleType, signalBuckets = []) {
  const allowed = new Set(getAllowedActionsForRuleType(uiRuleType, signalBuckets));
  return PAPER_ACTION_OPTIONS.filter((opt) => allowed.has(opt.id));
}

export { PAPER_ACTION_OPTIONS as ACTION_OPTIONS } from './paperActionLabels.js';

export function uiRuleTypeToApi(uiType) {
  if (uiType === 'signal_side_long') return { rule_type: 'signal_side', params: { side: 'long' } };
  if (uiType === 'signal_side_short') return { rule_type: 'signal_side', params: { side: 'short' } };
  if (uiType === 'signal_side_neutral') return { rule_type: 'signal_side', params: { side: 'neutral' } };
  if (uiType === 'signal_bucket') return { rule_type: 'signal_bucket', params: {} };
  return { rule_type: uiType, params: {} };
}

export function apiRuleToUiType(rule) {
  const t = String(rule?.rule_type || '').toLowerCase();
  const params = rule?.params || {};
  if (t === 'signal_side') {
    const side = String(params.side || '').toLowerCase();
    if (side === 'long') return 'signal_side_long';
    if (side === 'short') return 'signal_side_short';
    return 'signal_side_neutral';
  }
  if (t === 'signal_bucket') return 'signal_bucket';
  return t || 'always';
}

function buildSingleRulePayload(form, ticker) {
  const uiType = form.uiRuleType || form.rule_type || 'always';
  const { rule_type, params } = uiRuleTypeToApi(uiType);
  const action = String(form.action || 'BTO').toUpperCase();
  const closeAll = Boolean(form.closeAll) && isClosingPaperAction(action);

  const payload = {
    rule_type,
    ticker: String(ticker || '').toUpperCase(),
    action,
    qty: closeAll ? 1 : Number(form.qty),
    params: { ...params },
    is_active: form.is_active !== false
  };

  if (closeAll) {
    payload.params.close_all = true;
  }

  if (isOpeningPaperAction(action)) {
    const maxPos = Number(form.maxPositionQty);
    if (Number.isFinite(maxPos) && maxPos > 0) {
      payload.params.max_position_qty = maxPos;
    }
  }

  if (rule_type === 'signal_bucket') {
    const buckets = normalizeSignalBucketList(form.signalBuckets ?? form.signalBucket);
    if (buckets.length === 1) {
      payload.params.bucket = buckets[0];
    }
    payload.params.buckets = buckets;
  }
  if (rule_type === 'price_above' || rule_type === 'price_below') {
    payload.threshold_value = Number(form.threshold_value);
  }
  return payload;
}

/** One API rule per ticker when multiple symbols are selected. */
export function buildRulePayloads(form) {
  const tickers = Array.isArray(form.tickers)
    ? form.tickers.map((t) => String(t || '').trim().toUpperCase()).filter(Boolean)
    : [String(form.ticker || '').trim().toUpperCase()].filter(Boolean);

  const unique = [...new Set(tickers)];
  return unique.map((ticker) => buildSingleRulePayload(form, ticker));
}

export function buildRulePayload(form) {
  const payloads = buildRulePayloads(form);
  return payloads[0];
}

export function validateRuleForm(form, context = {}) {
  const { existingRules = [], excludeRuleId = null } = context;
  const tickers = Array.isArray(form.tickers)
    ? form.tickers.map((t) => String(t || '').trim()).filter(Boolean)
    : [String(form.ticker || '').trim()].filter(Boolean);
  if (!tickers.length) return 'Select at least one ticker';

  const action = String(form.action || 'BTO').toUpperCase();
  const closeAll = Boolean(form.closeAll) && isClosingPaperAction(action);

  if (!closeAll) {
    const qty = Number(form.qty);
    if (!Number.isFinite(qty) || qty <= 0) return 'Quantity must be greater than 0';
  }

  if (isOpeningPaperAction(action)) {
    const maxPos = Number(form.maxPositionQty);
    if (!Number.isFinite(maxPos) || maxPos <= 0) {
      return 'Max position limit is required for Buy and Short rules';
    }
    const qty = Number(form.qty);
    if (Number.isFinite(qty) && qty > maxPos) {
      return 'Qty per run cannot exceed max position limit';
    }
  }

  const uiType = form.uiRuleType || form.rule_type || 'always';
  if (uiType === 'price_above' || uiType === 'price_below') {
    const th = Number(form.threshold_value);
    if (!Number.isFinite(th) || th <= 0) return 'Threshold price is required';
  }
  if (uiType === 'signal_bucket') {
    const buckets = normalizeSignalBucketList(form.signalBuckets ?? form.signalBucket);
    if (!buckets.length) return 'Select at least one signal bucket';
    const disabled = getDisabledSignalBuckets(existingRules, tickers, action, excludeRuleId);
    for (const b of buckets) {
      if (disabled.has(b)) return `Signal ${b} is not available for this ticker and action`;
    }
  }

  if (isClosingPaperAction(action)) {
    const { blockedRuleTypes } = getExitSignalRestrictions(
      existingRules,
      tickers,
      action,
      excludeRuleId
    );
    if (blockedRuleTypes.has(uiType)) {
      return String(action).toUpperCase() === 'STC'
        ? 'Sell cannot use the same Odin long signals as your Buy entry rule'
        : 'Cover cannot use the same Odin short signals as your Short entry rule';
    }
  }

  return '';
}

function normalizeSignalBucketList(raw) {
  const list = Array.isArray(raw) ? raw : raw != null && raw !== '' ? [raw] : [];
  return [...new Set(list.map(normalizeSignalBucketCode).filter(Boolean))];
}

function formatBucketsLabel(buckets) {
  if (!buckets?.length) return '';
  return ` (${buckets.join(', ')})`;
}

export function formatRuleQty(rule) {
  if (rule?.params?.close_all) return 'ALL';
  const q = Number(rule.qty);
  return Number.isFinite(q) ? String(q) : '—';
}

export function ruleSummary(rule) {
  const ui = apiRuleToUiType(rule);
  const opt = RULE_TYPE_OPTIONS.find((o) => o.id === ui);
  const typeLabel = opt?.label || rule.rule_type;
  const th =
    rule.threshold_value != null && Number.isFinite(Number(rule.threshold_value))
      ? ` @ $${Number(rule.threshold_value).toFixed(2)}`
      : '';
  const bucket = formatBucketsLabel(parseRuleSignalBuckets(rule));
  const actionLabel = paperActionLabel(rule.action);
  const qtyLabel = formatRuleQty(rule);
  const maxPos = rule.params?.max_position_qty;
  const maxNote =
    maxPos != null && Number.isFinite(Number(maxPos))
      ? ` · max ${Number(maxPos)}`
      : '';
  return `${typeLabel}${th}${bucket} · ${rule.ticker} · ${actionLabel} ×${qtyLabel}${maxNote}`;
}

/** Map API rule → StrategyRuleForm state (single ticker). */
export function ruleToForm(rule) {
  const params = rule?.params || {};
  return {
    uiRuleType: apiRuleToUiType(rule),
    tickers: [String(rule.ticker || '').trim().toUpperCase()].filter(Boolean),
    action: String(rule.action || 'BTO').toUpperCase(),
    qty: String(rule.qty ?? '1'),
    maxPositionQty:
      params.max_position_qty != null && Number.isFinite(Number(params.max_position_qty))
        ? String(params.max_position_qty)
        : '10',
    closeAll: Boolean(params.close_all),
    threshold_value:
      rule.threshold_value != null && Number.isFinite(Number(rule.threshold_value))
        ? String(rule.threshold_value)
        : '',
    signalBuckets: parseRuleSignalBuckets(rule)
  };
}

/** Default rule payload when adding from watchlist long/short leaderboards. */
export function buildWatchlistQuickRule(ticker, side) {
  const sym = String(ticker || '').trim().toUpperCase();
  const isLong = side === 'long';
  return {
    rule_type: 'signal_side',
    ticker: sym,
    action: isLong ? 'BTO' : 'STO',
    qty: 1,
    params: {
      side: isLong ? 'long' : 'short',
      max_position_qty: 10
    },
    is_active: true
  };
}

export function ruleTickerKey(rule) {
  return String(rule?.ticker || '').trim().toUpperCase();
}
