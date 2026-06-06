import {
  isClosingPaperAction,
  isOpeningPaperAction,
  paperActionLabel
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
    payload.params.bucket = String(form.signalBucket || 'N').toUpperCase();
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

export function validateRuleForm(form) {
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
  if (uiType === 'signal_bucket' && !form.signalBucket) return 'Select a signal bucket';
  return '';
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
  const bucket = rule.params?.bucket ? ` (${rule.params.bucket})` : '';
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
    signalBucket: String(params.bucket || 'L1').toUpperCase()
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
