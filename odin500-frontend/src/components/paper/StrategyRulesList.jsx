import { Pencil, Trash2 } from 'lucide-react';
import { ruleSummary } from './strategyRuleUtils.js';

const RULES_SCROLL_THRESHOLD = 10;

export function StrategyRulesList({ rules = [], onEdit, onDelete, busy = false, editingRuleId = null }) {
  if (!rules.length) {
    return <p className="paper-strategy-muted">No rules yet. Add at least one rule to automate trades.</p>;
  }

  const scrollable = rules.length > RULES_SCROLL_THRESHOLD;

  const list = (
    <ul className="paper-strategy-rules-list">
      {rules.map((rule) => (
        <li
          key={rule.id}
          className={
            'paper-strategy-rules-list__item' +
            (editingRuleId === rule.id ? ' paper-strategy-rules-list__item--editing' : '')
          }
        >
          <div className="paper-strategy-rules-list__text">
            <span className="paper-strategy-rules-list__summary">{ruleSummary(rule)}</span>
            {rule.is_active === false ? (
              <span className="paper-strategy-rules-list__paused">Paused</span>
            ) : null}
          </div>
          <div className="paper-strategy-rules-list__actions">
            {onEdit ? (
              <button
                type="button"
                className="paper-btn paper-btn--icon paper-btn--ghost"
                disabled={busy}
                onClick={() => onEdit(rule)}
                aria-label={`Edit rule for ${rule.ticker || 'ticker'}`}
                title="Edit rule"
              >
                <Pencil className="paper-btn__icon" aria-hidden />
              </button>
            ) : null}
            {onDelete ? (
              <button
                type="button"
                className="paper-btn paper-btn--icon paper-btn--ghost paper-btn--danger"
                disabled={busy}
                onClick={() => onDelete(rule.id)}
                aria-label={`Remove rule for ${rule.ticker || 'ticker'}`}
                title="Remove rule"
              >
                <Trash2 className="paper-btn__icon" aria-hidden />
              </button>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );

  if (!scrollable) {
    return list;
  }

  return (
    <div className="paper-strategy-rules-list-scroll" role="region" aria-label="Strategy rules">
      {list}
    </div>
  );
}
