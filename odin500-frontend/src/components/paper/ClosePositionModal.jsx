import { useEffect, useMemo, useRef, useState } from 'react';
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

/** Opening legs — always offer long (BTO) and short (STO) when adding to a position. */
export function getOpenableLegs(position) {
  if (!position) return [];
  const longQty = Number(position.long_qty) || 0;
  const shortQty = Number(position.short_qty) || 0;
  return [
    {
      key: 'long',
      action: 'BTO',
      sideLabel: 'Long',
      verb: 'Buy',
      openQty: longQty,
      avgCost: position.avg_long_cost
    },
    {
      key: 'short',
      action: 'STO',
      sideLabel: 'Short',
      verb: 'Short',
      openQty: shortQty,
      avgCost: position.avg_short_cost
    }
  ];
}

function defaultOpenLegKey(longQty, shortQty) {
  if (shortQty > 0 && longQty === 0) return 'short';
  if (longQty > 0 && shortQty === 0) return 'long';
  if (shortQty > longQty) return 'short';
  return 'long';
}

const BUY_QTY_PRESETS = [1, 5, 10, 25, 50];

/**
 * @param {'close' | 'buy'} mode
 */
export function PositionOrderModal({ open, position, mode = 'close', onClose, onConfirm, busy = false }) {
  const isBuy = mode === 'buy';
  const closeLegs = useMemo(() => getClosableLegs(position), [position]);
  const openLegs = useMemo(() => getOpenableLegs(position), [position]);
  const legs = isBuy ? openLegs : closeLegs;
  const [legKey, setLegKey] = useState('long');
  const [qty, setQty] = useState('');
  const [error, setError] = useState('');
  const qtyInputRef = useRef(null);

  const leg = legs.find((l) => l.key === legKey) || legs[0];
  const quantity = Number(qty);
  const sym = position?.ticker ? String(position.ticker).toUpperCase() : '';
  const longQty = Number(position?.long_qty) || 0;
  const shortQty = Number(position?.short_qty) || 0;
  const isShortOpen = isBuy && leg?.action === 'STO';

  useEffect(() => {
    if (!open) return;
    setError('');
    if (isBuy) {
      const nextKey = defaultOpenLegKey(longQty, shortQty);
      setLegKey(nextKey);
      setQty('');
      requestAnimationFrame(() => qtyInputRef.current?.focus());
      return;
    }
    if (!closeLegs.length) return;
    setLegKey(closeLegs[0].key);
    setQty(String(closeLegs[0].qty));
  }, [open, isBuy, position?.ticker, position?.long_qty, position?.short_qty, closeLegs, longQty, shortQty]);

  async function handleSubmit() {
    if (!position) return;
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError('Enter a valid quantity');
      return;
    }
    if (!leg) return;
    if (!isBuy && quantity > leg.qty) {
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

  if (!position) return null;
  if (!isBuy && !closeLegs.length) return null;
  if (isBuy && !openLegs.length) return null;

  const estPrice = position.current_price;
  const estTotal =
    Number.isFinite(quantity) && quantity > 0 && estPrice != null && Number.isFinite(Number(estPrice))
      ? quantity * Number(estPrice)
      : null;

  const modalClass =
    'paper-pos-order-modal' +
    (isBuy ? ' paper-pos-order-modal--buy' : ' paper-pos-order-modal--close') +
    ' paper-close-position-modal';

  const title = isBuy ? `Add to ${sym}` : `Close ${sym}`;

  return (
    <PaperManageModal
      open={open}
      title={title}
      titleId="paper-pos-order-title"
      modalClassName={modalClass}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="paper-btn paper-btn--ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className={
              'paper-btn' +
              (isBuy
                ? isShortOpen
                  ? ' paper-btn--submit-short'
                  : ' paper-btn--submit-entry'
                : ' paper-btn--submit-exit')
            }
            onClick={() => void handleSubmit()}
            disabled={busy}
          >
            {busy
              ? 'Submitting…'
              : `${leg?.verb ?? 'Submit'} ${quantity > 0 ? quantity : ''} ${sym}`.trim()}
          </button>
        </>
      }
    >
      <div className="paper-pos-order-modal__hero">
        <span className="paper-pos-order-modal__sym">{sym}</span>
        <span
          className={
            'paper-pos-order-modal__pill' +
            (isBuy
              ? isShortOpen
                ? ' paper-pos-order-modal__pill--short'
                : ' paper-pos-order-modal__pill--buy'
              : ' paper-pos-order-modal__pill--close')
          }
        >
          {isBuy ? (isShortOpen ? 'Market short' : 'Market buy') : 'Market close'}
        </span>
      </div>

      <p className="paper-pos-order-modal__lead">
        {isBuy && leg?.action === 'BTO' ? (
          <>
            Add to your <strong>long</strong> position with a market <strong>{paperActionLabel('BTO')}</strong>{' '}
            order
            {longQty > 0 ? (
              <>
                {' '}
                (currently <strong>{longQty}</strong> long
                {shortQty > 0 ? (
                  <>
                    , <strong>{shortQty}</strong> short
                  </>
                ) : null}
                ).
              </>
            ) : (
              '.'
            )}
          </>
        ) : isBuy && leg?.action === 'STO' ? (
          <>
            Add to your <strong>short</strong> position with a market <strong>{paperActionLabel('STO')}</strong>{' '}
            order
            {shortQty > 0 ? (
              <>
                {' '}
                (currently <strong>{shortQty}</strong> short
                {longQty > 0 ? (
                  <>
                    , <strong>{longQty}</strong> long
                  </>
                ) : null}
                ).
              </>
            ) : (
              '.'
            )}
          </>
        ) : leg?.action === 'STC' ? (
          <>
            Close part or all of your <strong>long</strong> position with a market{' '}
            <strong>{paperActionLabel('STC')}</strong> order.
          </>
        ) : (
          <>
            Close part or all of your <strong>short</strong> position with a market{' '}
            <strong>{paperActionLabel('BTC')}</strong> order.
          </>
        )}
      </p>

      {(isBuy || closeLegs.length > 1) && legs.length ? (
        <div
          className="paper-pos-order-modal__legs"
          role="radiogroup"
          aria-label={isBuy ? 'Side to open or add to' : 'Position side to close'}
        >
          {legs.map((l) => (
            <label
              key={l.key}
              className={
                'paper-pos-order-modal__leg' + (legKey === l.key ? ' paper-pos-order-modal__leg--active' : '')
              }
            >
              <input
                type="radio"
                name={isBuy ? 'open-leg' : 'close-leg'}
                value={l.key}
                checked={legKey === l.key}
                onChange={() => {
                  setLegKey(l.key);
                  if (!isBuy) setQty(String(l.qty));
                  setError('');
                }}
                disabled={busy}
              />
              <span className="paper-pos-order-modal__leg-text">
                <span className="paper-pos-order-modal__leg-title">
                  {l.sideLabel} · {paperActionLabel(l.action)}
                </span>
                <span className="paper-pos-order-modal__leg-meta">
                  {isBuy ? (
                    <>
                      {l.openQty > 0 ? (
                        <>
                          Open {l.openQty} @ {money(l.avgCost)} · add with {l.verb.toLowerCase()}
                        </>
                      ) : (
                        <>No open {l.sideLabel.toLowerCase()} · {l.verb.toLowerCase()} to open</>
                      )}
                    </>
                  ) : (
                    <>
                      {l.qty} shares · {l.verb} @ {money(l.avgCost)}
                    </>
                  )}
                </span>
              </span>
            </label>
          ))}
        </div>
      ) : null}

      <dl className="paper-pos-order-modal__summary">
        {isBuy && leg ? (
          <div>
            <dt>Open {leg.sideLabel.toLowerCase()}</dt>
            <dd>
              {leg.openQty > 0 ? (
                <>
                  {leg.openQty} @ {money(leg.avgCost)}
                </>
              ) : (
                '—'
              )}
            </dd>
          </div>
        ) : !isBuy && leg ? (
          <div>
            <dt>Open {leg.sideLabel.toLowerCase()}</dt>
            <dd>
              {leg.qty} @ {money(leg.avgCost)}
            </dd>
          </div>
        ) : null}
        <div>
          <dt>Last price</dt>
          <dd>{money(estPrice)}</dd>
        </div>
        <div>
          <dt>Net qty</dt>
          <dd>{position.net_qty ?? 0}</dd>
        </div>
      </dl>

      <label className="paper-field paper-pos-order-modal__qty-field">
        <span className="paper-field__label">
          {isBuy
            ? leg?.action === 'STO'
              ? 'Shares to short'
              : 'Shares to buy'
            : `Quantity to ${leg?.verb.toLowerCase()}`}
        </span>
        <input
          ref={qtyInputRef}
          type="number"
          className="paper-field__input"
          min="1"
          max={isBuy ? undefined : leg?.qty}
          step="1"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          disabled={busy}
          placeholder={isBuy ? 'Enter quantity' : String(leg?.qty ?? '')}
        />
      </label>

      <div className="paper-qty-presets" aria-label="Quick quantity">
        {isBuy
          ? BUY_QTY_PRESETS.map((n) => (
              <button
                key={n}
                type="button"
                className="paper-qty-presets__btn"
                onClick={() => setQty(String(n))}
                disabled={busy}
              >
                {n}
              </button>
            ))
          : leg ? (
              <button
                type="button"
                className="paper-qty-presets__btn paper-qty-presets__btn--all"
                onClick={() => setQty(String(leg.qty))}
                disabled={busy}
              >
                ALL ({leg.qty})
              </button>
            ) : null}
      </div>

      {estTotal != null ? (
        <p className="paper-order__estimate paper-pos-order-modal__estimate">
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

/** @deprecated Use PositionOrderModal with mode="close" */
export function ClosePositionModal(props) {
  return <PositionOrderModal {...props} mode="close" />;
}
