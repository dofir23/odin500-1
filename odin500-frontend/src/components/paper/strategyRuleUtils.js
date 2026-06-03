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

export const ACTION_OPTIONS = [
  { id: 'BTO', label: 'BTO' },
  { id: 'STO', label: 'STO' },
  { id: 'BTC', label: 'BTC' },
  { id: 'STC', label: 'STC' }
];

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

export function buildRulePayload(form) {
  const uiType = form.uiRuleType || form.rule_type || 'always';
  const { rule_type, params } = uiRuleTypeToApi(uiType);
  const payload = {
    rule_type,
    ticker: String(form.ticker || '').toUpperCase(),
    action: String(form.action || 'BTO').toUpperCase(),
    qty: Number(form.qty),
    params: { ...params },
    is_active: form.is_active !== false
  };
  if (rule_type === 'signal_bucket') {
    payload.params.bucket = String(form.signalBucket || 'N').toUpperCase();
  }
  if (rule_type === 'price_above' || rule_type === 'price_below') {
    payload.threshold_value = Number(form.threshold_value);
  }
  return payload;
}

export function validateRuleForm(form) {
  const ticker = String(form.ticker || '').trim();
  if (!ticker) return 'Ticker is required';
  const qty = Number(form.qty);
  if (!Number.isFinite(qty) || qty <= 0) return 'Quantity must be greater than 0';
  const uiType = form.uiRuleType || form.rule_type || 'always';
  if (uiType === 'price_above' || uiType === 'price_below') {
    const th = Number(form.threshold_value);
    if (!Number.isFinite(th) || th <= 0) return 'Threshold price is required';
  }
  if (uiType === 'signal_bucket' && !form.signalBucket) return 'Select a signal bucket';
  return '';
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
  return `${typeLabel}${th}${bucket} · ${rule.ticker} · ${rule.action} ×${rule.qty}`;
}
