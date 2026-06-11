import { useEffect, useMemo, useState } from 'react';
import { PaperManageModal } from './PaperManageModal.jsx';
import { paperActionLabel } from './paperActionLabels.js';

function money(v) {
  if (v == null || !Number.isFinite(Number(v))) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(
    Number(v)
  );
}

export function getClosableLegs(position) {
  if (!position) return [];
  const long = Number(position.long_qty) || 0;
  const short = Number(position.short_qty) || 0;
  const legs = [];
  if (long > 0) {
    legs.push({
      key: 'long',
      action: 'STC',
      sideLabel: 'Long',
      verb: 'Sell',
      qty: long,
      avgCost: position.avg_long_cost
    });
  }
  if (short > 0) {
    legs.push({
      key: 'short',
      action: 'BTC',
      sideLabel: 'Short',
      verb: 'Cover',
      qty: short,
      avgCost: position.avg_short_cost
    });
  }
  return legs;
}

export function ClosePositionModal({ open, position, onClose, onConfirm, busy = false }) {
  const legs = useMemo(() => getClosableLegs(position), [position]);
  const [legKey, setLegKey] = useState('long');
  const [qty, setQty] = useState('');
  const [error, setError] = useState('');

  const leg = legs.find((l) => l.key === legKey) || legs[0];
  const quantity = Number(qty);
  const sym = position?.ticker ? String(position.ticker).toUpperCase() : '';

  useEffect(() => {
    if (!open || !legs.length) return;
    setLegKey(legs[0].key);
    setQty(String(legs[0].qty));
    setError('');
  }, [open, position?.ticker, position?.long_qty, position?.short_qty, legs]);

  async function handleSubmit() {
    if (!position || !leg) return;
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError('Enter a valid quantity');
      return;
    }
    if (quantity > leg.qty) {
      setError(`Maximum ${leg.verb.toLowerCase()} qty: ${leg.qty}`);
      return;
    }
    setError('');
    try {
      await onConfirm({
        ticker: sym,
        action: leg.action,
        qty: quantity,
        orderType: 'market'
      });
      onClose();
    } catch (err) {
      setError(err?.message || 'Order failed');
    }
  }

  if (!position || !legs.length) return null;

  const estPrice = position.current_price;
  const estTotal =
    Number.isFinite(quantity) && quantity > 0 && estPrice != null && Number.isFinite(Number(estPrice))
      ? quantity * Number(estPrice)
      : null;

  return (
    <PaperManageModal
      open={open}
      title={`Close ${sym}`}
      titleId="paper-close-position-title"
      modalClassName="paper-close-position-modal"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="wl-manage-btn wl-manage-btn--ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className="wl-manage-btn wl-manage-btn--danger"
            onClick={() => void handleSubmit()}
            disabled={busy}
          >
            {busy ? 'Submitting…' : `${leg.verb} ${sym}`}
          </button>
        </>
      }
    >
      <p className="paper-modal-msg">
        {leg.action === 'STC' ? (
          <>
            You have a <strong>long</strong> position. This will place a market{' '}
            <strong>{paperActionLabel('STC')}</strong> order.
          </>
        ) : (
          <>
            You have a <strong>short</strong> position. This will place a market{' '}
            <strong>{paperActionLabel('BTC')}</strong> order.
          </>
        )}
      </p>

      {legs.length > 1 ? (
        <div className="paper-close-pos__legs" role="radiogroup" aria-label="Position side to close">
          {legs.map((l) => (
            <label key={l.key} className="paper-close-pos__leg">
              <input
                type="radio"
                name="close-leg"
                value={l.key}
                checked={legKey === l.key}
                onChange={() => {
                  setLegKey(l.key);
                  setQty(String(l.qty));
                  setError('');
                }}
                disabled={busy}
              />
              <span>
                {l.sideLabel}: {l.qty} shares · {l.verb}
              </span>
            </label>
          ))}
        </div>
      ) : null}

      <dl className="paper-close-pos__summary">
        <div>
          <dt>Open {leg.sideLabel.toLowerCase()}</dt>
          <dd>
            {leg.qty} @ {money(leg.avgCost)}
          </dd>
        </div>
        <div>
          <dt>Last price</dt>
          <dd>{money(estPrice)}</dd>
        </div>
      </dl>

      <label className="paper-field">
        <span className="paper-field__label">Quantity to {leg.verb.toLowerCase()}</span>
        <input
          type="number"
          className="paper-field__input"
          min="1"
          max={leg.qty}
          step="1"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          disabled={busy}
        />
      </label>

      <div className="paper-qty-presets" aria-label="Quick quantity">
        <button
          type="button"
          className="paper-qty-presets__btn paper-qty-presets__btn--all"
          onClick={() => setQty(String(leg.qty))}
          disabled={busy}
        >
          ALL ({leg.qty})
        </button>
      </div>

      {estTotal != null ? (
        <p className="paper-order__estimate">
          Est. order value: <strong>{money(estTotal)}</strong>
          <span className="paper-order__estimate-meta">
            {' '}
            ({quantity} × {money(estPrice)}, mkt est.)
          </span>
        </p>
      ) : null}

      {error ? <p className="paper-feedback paper-feedback--err">{error}</p> : null}
    </PaperManageModal>
  );
}
