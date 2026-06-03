import { ruleSummary } from './strategyRuleUtils.js';

export function StrategyRulesList({ rules = [], onDelete, busy = false }) {
  if (!rules.length) {
    return <p className="paper-strategy-muted">No rules yet. Add at least one rule to automate trades.</p>;
  }
  return (
    <ul className="paper-strategy-rules-list">
      {rules.map((rule) => (
        <li key={rule.id} className="paper-strategy-rules-list__item">
          <div className="paper-strategy-rules-list__text">
            <span className="paper-strategy-rules-list__summary">{ruleSummary(rule)}</span>
            {rule.is_active === false ? (
              <span className="paper-strategy-rules-list__paused">Paused</span>
            ) : null}
          </div>
          {onDelete ? (
            <button
              type="button"
              className="paper-btn paper-btn--ghost paper-btn--sm"
              disabled={busy}
              onClick={() => onDelete(rule.id)}
            >
              Remove
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
