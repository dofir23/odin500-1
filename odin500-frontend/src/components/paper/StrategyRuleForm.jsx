import { useEffect, useState } from 'react';
import { TickerSymbolCombobox } from '../TickerSymbolCombobox.jsx';
import { ThemedDropdown } from '../ThemedDropdown.jsx';
import { isClosingPaperAction, isOpeningPaperAction } from './paperActionLabels.js';
import {
  RULE_TYPE_OPTIONS,
  SIGNAL_BUCKETS,
  ACTION_OPTIONS,
  buildRulePayload,
  buildRulePayloads,
  ruleToForm,
  validateRuleForm
} from './strategyRuleUtils.js';

const EMPTY = {
  uiRuleType: 'signal_side_long',
  tickers: [],
  action: 'BTO',
  qty: '1',
  maxPositionQty: '10',
  closeAll: false,
  threshold_value: '',
  signalBucket: 'L1'
};

export function StrategyRuleForm({
  onSubmit,
  busy = false,
  submitLabel = 'Add rule',
  editingRule = null,
  onCancelEdit,
  tickerSeed = null
}) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const isEditing = Boolean(editingRule?.id);

  useEffect(() => {
    if (editingRule) {
      setForm(ruleToForm(editingRule));
    } else {
      setForm(EMPTY);
    }
    setError('');
  }, [editingRule?.id]);

  useEffect(() => {
    if (!tickerSeed?.symbols?.length) return;
    setForm((f) => ({
      ...f,
      tickers: [
        ...new Set([
          ...f.tickers,
          ...tickerSeed.symbols.map((s) => String(s || '').trim().toUpperCase()).filter(Boolean)
        ])
      ]
    }));
  }, [tickerSeed?.nonce]);

  const showThreshold =
    form.uiRuleType === 'price_above' || form.uiRuleType === 'price_below';
  const showBucket = form.uiRuleType === 'signal_bucket';
  const isOpen = isOpeningPaperAction(form.action);
  const isClose = isClosingPaperAction(form.action);

  function update(patch) {
    setForm((f) => {
      const next = { ...f, ...patch };
      if (patch.action) {
        if (isOpeningPaperAction(patch.action)) {
          next.closeAll = false;
        }
        if (isClosingPaperAction(patch.action)) {
          next.maxPositionQty = '';
        }
      }
      return next;
    });
    setError('');
  }

  function handleSubmit(e) {
    e.preventDefault();
    const err = validateRuleForm(form);
    if (err) {
      setError(err);
      return;
    }
    if (isEditing) {
      onSubmit(buildRulePayload(form));
    } else {
      const payloads = buildRulePayloads(form);
      onSubmit(payloads.length === 1 ? payloads[0] : payloads);
    }
    if (!isEditing) {
      setForm(EMPTY);
    }
    setError('');
  }

  function handleCancel() {
    setForm(EMPTY);
    setError('');
    onCancelEdit?.();
  }

  const qtyField = (
    <label className="paper-field paper-strategy-close-qty__qty">
      <span className="paper-field__label">Qty per run</span>
      <input
        type="number"
        className="paper-input"
        min="0.000001"
        step="any"
        value={form.qty}
        onChange={(e) => update({ qty: e.target.value })}
      />
    </label>
  );

  return (
    <form className="paper-strategy-rule-form" onSubmit={handleSubmit}>
      {isEditing ? (
        <p className="paper-strategy-muted paper-strategy-rule-form__hint">
          Editing rule for <strong>{editingRule.ticker}</strong>
        </p>
      ) : null}
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
        <label className="paper-field paper-field--span2">
          <span className="paper-field__label">Tickers</span>
          <TickerSymbolCombobox
            multiple={!isEditing}
            symbols={form.tickers}
            onSymbolsChange={(symbols) => update({ tickers: symbols })}
            inputId="paper-strategy-ticker"
            placeholder="e.g. AAPL, MSFT"
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

        {isClose ? (
          <div className="paper-field paper-field--span2 paper-strategy-close-qty">
            <span className="paper-field__label">Exit quantity</span>
            <div className="paper-strategy-close-qty__row">
              <label
                className={
                  'paper-strategy-close-qty__option' +
                  (form.closeAll ? ' paper-strategy-close-qty__option--active' : '')
                }
              >
                <input
                  type="checkbox"
                  className="paper-strategy-close-qty__check"
                  checked={form.closeAll}
                  onChange={(e) => update({ closeAll: e.target.checked })}
                />
                <span className="paper-strategy-close-qty__option-body">
                  <span className="paper-strategy-close-qty__option-title">Close all (ALL)</span>
                  <span className="paper-strategy-close-qty__option-sub">
                    Flatten the full open position
                  </span>
                </span>
              </label>
              {!form.closeAll ? qtyField : null}
            </div>
          </div>
        ) : (
          qtyField
        )}

        {isOpen ? (
          <label className="paper-field">
            <span className="paper-field__label">Max position limit</span>
            <input
              type="number"
              className="paper-input"
              min="0.000001"
              step="any"
              value={form.maxPositionQty}
              onChange={(e) => update({ maxPositionQty: e.target.value })}
              placeholder="Never exceed this total size"
            />
          </label>
        ) : null}
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
      {isOpen ? (
        <p className="paper-strategy-muted paper-strategy-rule-form__hint">
          Buys or shorts up to the qty per run on each schedule tick, but total position will never
          exceed the max limit.
        </p>
      ) : null}
      {isClose && form.closeAll ? (
        <p className="paper-strategy-muted paper-strategy-rule-form__hint">
          On trigger, closes your full open position for each ticker (all long shares for Sell, all
          short shares for Cover).
        </p>
      ) : null}
      {error ? <p className="paper-strategy-err">{error}</p> : null}
      <div className="paper-strategy-rule-form__actions">
        {isEditing ? (
          <button type="button" className="paper-btn paper-btn--ghost" disabled={busy} onClick={handleCancel}>
            Cancel
          </button>
        ) : null}
        <button type="submit" className="paper-btn paper-btn--ghost" disabled={busy}>
          {busy ? 'Saving…' : isEditing ? 'Save changes' : submitLabel}
        </button>
      </div>
    </form>
  );
}
