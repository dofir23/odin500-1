import { useState } from 'react';
import { StrategyRuleForm } from './StrategyRuleForm.jsx';
import { StrategyRulesList } from './StrategyRulesList.jsx';
import { StrategyExecutionLog } from './StrategyExecutionLog.jsx';
import { AutomatedAccountBanner } from './AutomatedAccountBanner.jsx';

export function StrategyPanel({
  strategy,
  binding,
  rules,
  executionLog,
  strategyActive,
  loading,
  error,
  onAddRule,
  onDeleteRule,
  onToggleActive,
  onRunOnce,
  onRefetch
}) {
  const [busy, setBusy] = useState(false);
  const [runMsg, setRunMsg] = useState('');

  if (loading) {
    return <p className="paper-strategy-muted">Loading strategy…</p>;
  }

  if (!strategy) {
    return (
      <div className="paper-strategy-empty">
        <p>No strategy linked to this portfolio yet.</p>
        <p className="paper-strategy-muted">
          Use <strong>New strategy account</strong> in the header to create an automated portfolio, or bind a
          strategy from the API.
        </p>
      </div>
    );
  }

  const paused = !strategyActive;

  async function wrap(fn) {
    setBusy(true);
    setRunMsg('');
    try {
      await fn();
      await onRefetch?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="paper-strategy-panel">
      <AutomatedAccountBanner />
      {error ? <p className="paper-strategy-err">{error}</p> : null}

      <div className="paper-strategy-panel__head">
        <div>
          <h3 className="paper-strategy-panel__title">{strategy.name}</h3>
          <p className="paper-strategy-muted">
            Status:{' '}
            <span className={paused ? 'paper-strategy-paused' : 'paper-strategy-live'}>
              {paused ? 'Paused' : 'Active'}
            </span>
            {binding?.last_run_at ? (
              <>
                {' '}
                · Last run {new Date(binding.last_run_at).toLocaleString()}
              </>
            ) : null}
            {binding?.last_error ? (
              <span className="paper-strategy-err"> · {binding.last_error}</span>
            ) : null}
          </p>
        </div>
        <div className="paper-strategy-panel__actions">
          <button
            type="button"
            className="paper-btn paper-btn--ghost"
            disabled={busy}
            onClick={() => void wrap(() => onToggleActive(!strategyActive))}
          >
            {strategyActive ? 'Pause' : 'Resume'}
          </button>
          <button
            type="button"
            className="paper-btn paper-btn--primary"
            disabled={busy || paused}
            onClick={() =>
              void wrap(async () => {
                const out = await onRunOnce();
                setRunMsg(
                  `Run complete — triggered: ${out?.triggered ?? 0}, failed: ${out?.failed ?? 0}`
                );
              })
            }
          >
            {busy ? 'Running…' : 'Run now'}
          </button>
        </div>
      </div>

      {runMsg ? <p className="paper-strategy-run-msg">{runMsg}</p> : null}

      <section className="paper-strategy-section">
        <h4 className="paper-strategy-section__title">Rules</h4>
        <StrategyRulesList
          rules={rules}
          busy={busy}
          onDelete={(ruleId) => void wrap(() => onDeleteRule(ruleId))}
        />
        <StrategyRuleForm
          busy={busy}
          onSubmit={(payload) => void wrap(() => onAddRule(payload))}
        />
      </section>

      <section className="paper-strategy-section">
        <h4 className="paper-strategy-section__title">Execution log</h4>
        <StrategyExecutionLog log={executionLog} />
      </section>

      <p className="paper-strategy-docs">
        Strategies evaluate every ~5 minutes when server jobs are enabled. Odin signal rules use the same
        L1–S3 / N buckets as ticker pages.
      </p>
    </div>
  );
}
