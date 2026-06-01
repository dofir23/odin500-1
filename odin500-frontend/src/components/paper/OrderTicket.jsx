import { useMemo, useState } from 'react';
import { TickerSymbolCombobox } from '../TickerSymbolCombobox.jsx';

const QTY_PRESETS = [10, 25, 50, 100, 500];

function money(v) {
  if (v == null || !Number.isFinite(Number(v))) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(v));
}

export function OrderTicket({ onPlaceOrder, positions = [] }) {
  const [ticker, setTicker] = useState('');
  const [side, setSide] = useState('buy');
  const [orderType, setOrderType] = useState('market');
  const [qty, setQty] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const sym = ticker.trim().toUpperCase();
  const isBuy = side === 'buy';
  const quantity = Number(qty);
  const heldQty = useMemo(() => {
    const row = positions.find((p) => String(p.ticker).toUpperCase() === sym);
    return row ? Number(row.qty) : 0;
  }, [positions, sym]);

  const estPrice = orderType === 'limit' && limitPrice ? Number(limitPrice) : null;
  const estTotal =
    Number.isFinite(quantity) && quantity > 0 && estPrice != null && Number.isFinite(estPrice)
      ? quantity * estPrice
      : null;

  function onSymbolChange(next) {
    setTicker(next);
    setSuccess('');
    setError('');
  }

  async function handleSubmit() {
    setError('');
    setSuccess('');
    if (!sym) {
      setError('Search and select a ticker symbol');
      return;
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError('Enter a valid quantity');
      return;
    }
    if (!isBuy && heldQty < quantity) {
      setError(`You only hold ${heldQty} share${heldQty === 1 ? '' : 's'} of ${sym}`);
      return;
    }

    const body = { ticker: sym, side, qty: quantity, orderType };
    if (orderType === 'limit') {
      const lp = Number(limitPrice);
      if (!Number.isFinite(lp) || lp <= 0) {
        setError('Enter a valid limit price');
        return;
      }
      body.limitPrice = lp;
    }

    setBusy(true);
    try {
      const result = await onPlaceOrder(body);
      const fillPrice = result?.fill?.fillPrice ?? result?.order?.avg_fill_price;
      if (fillPrice != null) {
        setSuccess(`Filled ${quantity} @ ${Number(fillPrice).toFixed(2)}`);
      } else if (result?.pending) {
        setSuccess('Limit order queued — fills when price is reached');
      } else {
        setSuccess('Order submitted');
      }
      setQty('');
      setLimitPrice('');
    } catch (err) {
      setError(err?.message || 'Order failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="paper-card">
      <div className="paper-card__head">
        <h2 className="paper-card__title">Place order</h2>
        {sym ? <span className="paper-table__sym">{sym}</span> : null}
      </div>
      <div className="paper-card__body paper-order">
        <div className="paper-order__symbol-block">
          <span className="paper-order__symbol-label">Symbol</span>
          <TickerSymbolCombobox
            variant="header"
            symbol={ticker}
            onSymbolChange={onSymbolChange}
            inputId="paper-ticker-search"
            placeholder="Search symbol or company (e.g. NVDA)"
          />
          {sym && heldQty > 0 ? (
            <p className="paper-order__estimate">
              Position: <strong>{heldQty}</strong> shares
            </p>
          ) : null}
        </div>

        <div className="paper-side-toggle" role="group" aria-label="Order side">
          <button
            type="button"
            className={
              'paper-side-toggle__btn paper-side-toggle__btn--buy' +
              (isBuy ? ' paper-side-toggle__btn--active' : '')
            }
            onClick={() => setSide('buy')}
          >
            Buy
          </button>
          <button
            type="button"
            className={
              'paper-side-toggle__btn paper-side-toggle__btn--sell' +
              (!isBuy ? ' paper-side-toggle__btn--active' : '')
            }
            onClick={() => setSide('sell')}
          >
            Sell
          </button>
        </div>

        <label className="paper-field">
          <span className="paper-field__label">Order type</span>
          <select
            className="paper-field__select"
            value={orderType}
            onChange={(e) => setOrderType(e.target.value)}
          >
            <option value="market">Market</option>
            <option value="limit">Limit</option>
          </select>
        </label>

        <label className="paper-field">
          <span className="paper-field__label">Quantity (shares)</span>
          <input
            type="number"
            className="paper-field__input"
            min="1"
            step="1"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            placeholder="0"
          />
        </label>

        <div className="paper-qty-presets" aria-label="Quick quantity">
          {QTY_PRESETS.map((n) => (
            <button
              key={n}
              type="button"
              className="paper-qty-presets__btn"
              onClick={() => setQty(String(n))}
            >
              {n}
            </button>
          ))}
        </div>

        {orderType === 'limit' ? (
          <label className="paper-field">
            <span className="paper-field__label">Limit price</span>
            <input
              type="number"
              className="paper-field__input"
              min="0"
              step="0.01"
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              placeholder="0.00"
            />
          </label>
        ) : null}

        {estTotal != null ? (
          <p className="paper-order__estimate">
            Est. order value: <strong>{money(estTotal)}</strong> (limit)
          </p>
        ) : null}

        {error ? <p className="paper-feedback paper-feedback--err">{error}</p> : null}
        {success ? <p className="paper-feedback paper-feedback--ok">{success}</p> : null}

        <button
          type="button"
          className={'paper-submit' + (isBuy ? ' paper-submit--buy' : ' paper-submit--sell')}
          disabled={busy || !sym}
          onClick={() => void handleSubmit()}
        >
          {busy ? 'Submitting…' : `${isBuy ? 'Buy' : 'Sell'} ${sym || 'stock'}`}
        </button>
      </div>
    </div>
  );
}
