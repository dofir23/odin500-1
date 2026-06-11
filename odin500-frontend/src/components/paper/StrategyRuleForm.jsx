import { useEffect, useMemo, useState } from 'react';
import { TickerSymbolCombobox } from '../TickerSymbolCombobox.jsx';
import { ThemedDropdown } from '../ThemedDropdown.jsx';
import { SignalBucketMultiSelect } from './SignalBucketMultiSelect.jsx';
import { isClosingPaperAction, isOpeningPaperAction } from './paperActionLabels.js';
import {
  buildActionOptions,
  buildRulePayload,
  buildRulePayloads,
  buildRuleTypeOptions,
  coalesceActionForRuleType,
  getDisabledSignalBuckets,
  getExitSignalRestrictions,
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
  signalBuckets: []
};

export function StrategyRuleForm({
  onSubmit,
  busy = false,
  submitLabel = 'Add rule',
  editingRule = null,
  onCancelEdit,
  tickerSeed = null,
  existingRules = [],
  variant = 'inline',
  formId,
  hideActions = false
}) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const isEditing = Boolean(editingRule?.id);
  const excludeRuleId = editingRule?.id ?? editingRule?._localId ?? null;

  useEffect(() => {
    if (editingRule) {
      setForm(ruleToForm(editingRule));
    } else {
      setForm(EMPTY);
    }
    setError('');
  }, [editingRule?.id]);

  const showBucket = form.uiRuleType === 'signal_bucket';

  const ruleTypeOptions = useMemo(
    () => buildRuleTypeOptions(existingRules, form.tickers, form.action, excludeRuleId),
    [existingRules, form.tickers, form.action, excludeRuleId]
  );

  const actionOptions = useMemo(
    () => buildActionOptions(form.uiRuleType, form.signalBuckets),
    [form.uiRuleType, form.signalBuckets]
  );

  useEffect(() => {
    setForm((f) => {
      const nextAction = coalesceActionForRuleType(f.uiRuleType, f.signalBuckets, f.action);
      if (nextAction === f.action) return f;
      const next = { ...f, action: nextAction };
      if (isOpeningPaperAction(nextAction)) {
        next.closeAll = false;
        if (!next.maxPositionQty) next.maxPositionQty = '10';
      }
      if (isClosingPaperAction(nextAction)) {
        next.maxPositionQty = '';
      }
      return next;
    });
  }, [form.uiRuleType, form.signalBuckets]);

  const disabledBuckets = useMemo(
    () => getDisabledSignalBuckets(existingRules, form.tickers, form.action, excludeRuleId),
    [existingRules, form.tickers, form.action, excludeRuleId]
  );

  const exitRestrictions = useMemo(
    () =>
      isClosingPaperAction(form.action)
        ? getExitSignalRestrictions(existingRules, form.tickers, form.action, excludeRuleId)
        : { blockedRuleTypes: new Set(), blockedBuckets: new Set() },
    [existingRules, form.tickers, form.action, excludeRuleId]
  );

  const blockedRuleTypeKey = useMemo(
    () => [...exitRestrictions.blockedRuleTypes].sort().join(','),
    [exitRestrictions]
  );

  useEffect(() => {
    if (!showBucket || !form.signalBuckets?.length) return;
    const pruned = form.signalBuckets.filter((b) => !disabledBuckets.has(b));
    if (pruned.length !== form.signalBuckets.length) {
      setForm((f) => ({ ...f, signalBuckets: pruned }));
    }
  }, [disabledBuckets, form.signalBuckets, showBucket]);

  useEffect(() => {
    if (!blockedRuleTypeKey) return;
    const blocked = new Set(blockedRuleTypeKey.split(',').filter(Boolean));
    if (!blocked.has(form.uiRuleType)) return;
    const fallback = ruleTypeOptions.find((o) => !o.disabled);
    if (!fallback || fallback.id === form.uiRuleType) return;
    setForm((f) => ({
      ...f,
      uiRuleType: fallback.id,
      signalBuckets: fallback.id === 'signal_bucket' ? f.signalBuckets : []
    }));
  }, [blockedRuleTypeKey, form.uiRuleType, ruleTypeOptions]);

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
  const isOpen = isOpeningPaperAction(form.action);
  const isClose = isClosingPaperAction(form.action);
  const editTicker = form.tickers[0] || '';

  function update(patch) {
    setForm((f) => {
      const next = { ...f, ...patch };
      if (patch.uiRuleType !== undefined || patch.signalBuckets !== undefined) {
        next.action = coalesceActionForRuleType(
          next.uiRuleType,
          next.signalBuckets,
          next.action
        );
      }
      const actionChanged =
        patch.action !== undefined ||
        (patch.uiRuleType !== undefined || patch.signalBuckets !== undefined);
      if (actionChanged) {
        if (isOpeningPaperAction(next.action)) {
          next.closeAll = false;
        }
        if (isClosingPaperAction(next.action)) {
          next.maxPositionQty = '';
        }
      }
      return next;
    });
    setError('');
  }

  function handleSubmit(e) {
    e.preventDefault();
    const err = validateRuleForm(form, { existingRules, excludeRuleId });
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

  const isModal = variant === 'modal';
  const showInlineActions = !hideActions;

  const submitBtnClass =
    'paper-btn' +
    (isEditing
      ? ' paper-btn--submit-entry'
      : isOpeningPaperAction(form.action)
        ? ' paper-btn--submit-entry'
        : ' paper-btn--submit-exit');

  return (
    <form
      id={formId}
      className={'paper-strategy-rule-form' + (isModal ? ' paper-strategy-rule-form--modal' : '')}
      onSubmit={handleSubmit}
    >
      {isEditing && !isModal ? (
        <p className="paper-strategy-muted paper-strategy-rule-form__hint">
          Editing rule for <strong>{editingRule.ticker}</strong>
        </p>
      ) : null}
      <div className="paper-strategy-rule-form__grid">
        <label className="paper-field">
          <span className="paper-field__label">Rule type</span>
          <ThemedDropdown
            className="paper-strategy-rule-form__dd"
            wideLabel
            value={form.uiRuleType}
            options={ruleTypeOptions}
            onChange={(id) =>
              update({
                uiRuleType: id,
                signalBuckets: id === 'signal_bucket' ? form.signalBuckets : []
              })
            }
            ariaLabelPrefix="Rule type"
            labelFallback="Rule type"
          />
        </label>
        <label className="paper-field">
          <span className="paper-field__label">Tickers</span>
          <TickerSymbolCombobox
            multiple={!isEditing}
            symbol={editTicker}
            onSymbolChange={(sym) =>
              update({ tickers: sym ? [String(sym).trim().toUpperCase()] : [] })
            }
            symbols={form.tickers}
            onSymbolsChange={(symbols) => update({ tickers: symbols })}
            inputId="paper-strategy-ticker"
            placeholder="e.g. AAPL, MSFT"
          />
        </label>
        <label className="paper-field">
          <span className="paper-field__label">Action</span>
          <ThemedDropdown
            className="paper-strategy-rule-form__dd"
            value={form.action}
            options={actionOptions}
            onChange={(id) => update({ action: id })}
            ariaLabelPrefix="Action"
            labelFallback="Action"
          />
        </label>

        {isClose ? (
          <div className="paper-field paper-field--span2 paper-strategy-close-qty">
            <div className="paper-strategy-close-qty__row">
              <label
                className={
                  'paper-field paper-strategy-close-qty__close' +
                  (form.closeAll ? ' paper-strategy-close-qty__close--active' : '')
                }
              >
                <span className="paper-field__label">Close all</span>
                <span className="paper-strategy-close-qty__control">
                  <input
                    type="checkbox"
                    className="paper-strategy-close-qty__check"
                    checked={form.closeAll}
                    onChange={(e) => update({ closeAll: e.target.checked })}
                  />
                  <span className="paper-strategy-close-qty__control-text">Close all (ALL)</span>
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
          <SignalBucketMultiSelect
            selected={form.signalBuckets}
            disabledBuckets={disabledBuckets}
            exitBlockedBuckets={exitRestrictions.blockedBuckets}
            busy={busy}
            onChange={(signalBuckets) => update({ signalBuckets })}
          />
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
      {showInlineActions ? (
        <div className="paper-strategy-rule-form__actions">
          {isEditing ? (
            <button type="button" className="paper-btn paper-btn--danger" disabled={busy} onClick={handleCancel}>
              Cancel
            </button>
          ) : null}
          <button type="submit" className={submitBtnClass} disabled={busy}>
            {busy ? 'Saving…' : isEditing ? 'Save changes' : submitLabel}
          </button>
        </div>
      ) : null}
    </form>
  );
}
