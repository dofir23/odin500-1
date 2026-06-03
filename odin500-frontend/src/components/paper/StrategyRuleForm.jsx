import { useState } from 'react';
import { TickerSymbolCombobox } from '../TickerSymbolCombobox.jsx';
import { ThemedDropdown } from '../ThemedDropdown.jsx';
import {
  RULE_TYPE_OPTIONS,
  SIGNAL_BUCKETS,
  ACTION_OPTIONS,
  buildRulePayload,
  validateRuleForm
} from './strategyRuleUtils.js';

const EMPTY = {
  uiRuleType: 'signal_side_long',
  ticker: '',
  action: 'BTO',
  qty: '1',
  threshold_value: '',
  signalBucket: 'L1'
};

export function StrategyRuleForm({ onSubmit, busy = false, submitLabel = 'Add rule' }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');

  const showThreshold =
    form.uiRuleType === 'price_above' || form.uiRuleType === 'price_below';
  const showBucket = form.uiRuleType === 'signal_bucket';

  function update(patch) {
    setForm((f) => ({ ...f, ...patch }));
    setError('');
  }

  function handleSubmit(e) {
    e.preventDefault();
    const err = validateRuleForm(form);
    if (err) {
      setError(err);
      return;
    }
    onSubmit(buildRulePayload(form));
    setForm(EMPTY);
    setError('');
  }

  return (
    <form className="paper-strategy-rule-form" onSubmit={handleSubmit}>
      <div className="paper-strategy-rule-form__grid">
        <label className="paper-field">
          <span className="paper-field__label">Rule type</span>
          <ThemedDropdown
            value={form.uiRuleType}
            options={RULE_TYPE_OPTIONS}
            onChange={(id) => update({ uiRuleType: id })}
            ariaLabelPrefix="Rule type"
            labelFallback="Rule type"
          />
        </label>
        <label className="paper-field">
          <span className="paper-field__label">Ticker</span>
          <TickerSymbolCombobox
            symbol={form.ticker}
            onSymbolChange={(v) => update({ ticker: v })}
            inputId="paper-strategy-ticker"
            placeholder="e.g. AAPL"
          />
        </label>
        <label className="paper-field">
          <span className="paper-field__label">Action</span>
          <ThemedDropdown
            value={form.action}
            options={ACTION_OPTIONS}
            onChange={(id) => update({ action: id })}
            ariaLabelPrefix="Action"
            labelFallback="Action"
          />
        </label>
        <label className="paper-field">
          <span className="paper-field__label">Qty</span>
          <input
            type="number"
            className="paper-input"
            min="0.000001"
            step="any"
            value={form.qty}
            onChange={(e) => update({ qty: e.target.value })}
          />
        </label>
        {showThreshold ? (
          <label className="paper-field">
            <span className="paper-field__label">Threshold ($)</span>
            <input
              type="number"
              className="paper-input"
              min="0"
              step="0.01"
              value={form.threshold_value}
              onChange={(e) => update({ threshold_value: e.target.value })}
            />
          </label>
        ) : null}
        {showBucket ? (
          <label className="paper-field">
            <span className="paper-field__label">Signal bucket</span>
            <ThemedDropdown
              value={form.signalBucket}
              options={SIGNAL_BUCKETS.map((b) => ({ id: b, label: b }))}
              onChange={(id) => update({ signalBucket: id })}
              ariaLabelPrefix="Signal bucket"
              labelFallback="Bucket"
            />
          </label>
        ) : null}
      </div>
      {error ? <p className="paper-strategy-err">{error}</p> : null}
      <button type="submit" className="paper-btn paper-btn--ghost" disabled={busy}>
        {busy ? 'Saving…' : submitLabel}
      </button>
    </form>
  );
}
