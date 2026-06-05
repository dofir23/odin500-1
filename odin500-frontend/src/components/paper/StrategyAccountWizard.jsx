import { useState } from 'react';
import { PaperManageModal } from './PaperManageModal.jsx';
import { StrategyRuleForm } from './StrategyRuleForm.jsx';
import { StrategyRulesList } from './StrategyRulesList.jsx';
import { ruleSummary } from './strategyRuleUtils.js';

export function StrategyAccountWizard({
  open,
  onClose,
  onComplete,
  createAccount,
  createStrategy,
  addRule,
  bindStrategy
}) {
  const [step, setStep] = useState(0);
  const [accountName, setAccountName] = useState('');
  const [strategyName, setStrategyName] = useState('');
  const [pendingRules, setPendingRules] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function reset() {
    setStep(0);
    setAccountName('');
    setStrategyName('');
    setPendingRules([]);
    setError('');
    setBusy(false);
  }

  function handleClose() {
    reset();
    onClose?.();
  }

  function addPendingRule(payload) {
    setPendingRules((r) => [...r, { ...payload, _localId: `${Date.now()}-${r.length}` }]);
  }

  async function finish() {
    const accName = accountName.trim();
    const stratName = strategyName.trim();
    if (!accName) {
      setError('Enter an account name');
      return;
    }
    if (!stratName) {
      setError('Enter a strategy name');
      return;
    }
    if (!pendingRules.length) {
      setError('Add at least one rule');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const displayName = accName ? accName : "Strategy Account";
      const account = await createAccount({ name: displayName });
      const strategy = await createStrategy({ name: stratName, description: null });
      for (const rule of pendingRules) {
        const { _localId, ...payload } = rule;
        await addRule(strategy.id, payload);
      }
      await bindStrategy(strategy.id, account.id, true);
      handleClose();
      await onComplete?.({ accountId: account.id, strategyId: strategy.id });
    } catch (err) {
      setError(err?.message || 'Failed to create strategy account');
    } finally {
      setBusy(false);
    }
  }

  const footer = (
    <>
      <button type="button" className="wl-manage-btn wl-manage-btn--ghost" onClick={handleClose} disabled={busy}>
        Cancel
      </button>
      {step > 0 ? (
        <button
          type="button"
          className="wl-manage-btn wl-manage-btn--ghost"
          onClick={() => setStep((s) => s - 1)}
          disabled={busy}
        >
          Back
        </button>
      ) : null}
      {step < 2 ? (
        <button
          type="button"
          className="wl-manage-btn wl-manage-btn--primary"
          disabled={busy}
          onClick={() => {
            if (step === 0 && !accountName.trim()) {
              setError('Enter an account name');
              return;
            }
            if (step === 1 && !strategyName.trim()) {
              setError('Enter a strategy name');
              return;
            }
            setError('');
            setStep((s) => s + 1);
          }}
        >
          Next
        </button>
      ) : (
        <button
          type="button"
          className="wl-manage-btn wl-manage-btn--primary"
          disabled={busy}
          onClick={() => void finish()}
        >
          {busy ? 'Creating…' : 'Create strategy account'}
        </button>
      )}
    </>
  );

  return (
    <PaperManageModal
      open={open}
      title="New strategy account"
      titleId="paper-strategy-wizard-title"
      onClose={handleClose}
      footer={footer}
    >
      {step === 0 ? (
        <>
          <p className="paper-modal-msg">
            Create a dedicated paper portfolio with automated rules (price or Odin signals).
          </p>
          <label className="wl-manage-label" htmlFor="paper-wizard-account-name">
            Portfolio name
          </label>
          <input
            id="paper-wizard-account-name"
            type="text"
            className="wl-manage-input"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            placeholder="e.g. Tech momentum"
            disabled={busy}
          />
        </>
      ) : null}
      {step === 1 ? (
        <>
          <label className="wl-manage-label" htmlFor="paper-wizard-strategy-name">
            Strategy name
          </label>
          <input
            id="paper-wizard-strategy-name"
            type="text"
            className="wl-manage-input"
            value={strategyName}
            onChange={(e) => setStrategyName(e.target.value)}
            placeholder="e.g. AAPL long on L2"
            disabled={busy}
          />
        </>
      ) : null}
      {step === 2 ? (
        <>
          <p className="paper-modal-msg">Add one or more rules. The strategy runs on the server schedule (~5 min).</p>
          <ul className="paper-strategy-rules-list">
            {pendingRules.map((r) => (
              <li key={r._localId} className="paper-strategy-rules-list__item">
                <span>{ruleSummary(r)}</span>
                <button
                  type="button"
                  className="paper-btn paper-btn--ghost paper-btn--sm"
                  onClick={() => setPendingRules((list) => list.filter((x) => x._localId !== r._localId))}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <StrategyRuleForm busy={busy} onSubmit={addPendingRule} submitLabel="Add to list" />
        </>
      ) : null}
      {error ? <p className="wl-manage-err">{error}</p> : null}
    </PaperManageModal>
  );
}
