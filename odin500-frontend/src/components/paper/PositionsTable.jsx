import { useState } from 'react';
import { fmtAbsSigned, fmtPctSigned } from '../../utils/formatDisplayNumber.js';
import { ClosePositionModal, getClosableLegs } from './ClosePositionModal.jsx';

function money(v) {
  if (v == null || Number.isNaN(Number(v))) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(
    Number(v)
  );
}

function toneClass(v) {
  if (Number(v) > 0) return 'paper-tone-up';
  if (Number(v) < 0) return 'paper-tone-down';
  return '';
}

function positionCostBasis(p) {
  const netQty = Number(p.net_qty) || 0;
  if (netQty > 0 && p.avg_long_cost != null) return Number(p.avg_long_cost);
  if (netQty < 0 && p.avg_short_cost != null) return Number(p.avg_short_cost);
  if (Number(p.long_qty) > 0 && !Number(p.short_qty) && p.avg_long_cost != null) return Number(p.avg_long_cost);
  if (Number(p.short_qty) > 0 && !Number(p.long_qty) && p.avg_short_cost != null) return Number(p.avg_short_cost);
  return null;
}

function positionChangePerShare(p) {
  const price = Number(p.current_price);
  if (!Number.isFinite(price)) return null;
  const cost = positionCostBasis(p);
  if (cost == null || !Number.isFinite(cost)) return null;
  const netQty = Number(p.net_qty) || 0;
  if (netQty > 0) return price - cost;
  if (netQty < 0) return cost - price;
  return null;
}

function positionChangePct(p) {
  if (p.unrealized_pnl_pct != null && Number.isFinite(Number(p.unrealized_pnl_pct))) {
    return Number(p.unrealized_pnl_pct);
  }
  const cost = positionCostBasis(p);
  const change = positionChangePerShare(p);
  if (cost == null || change == null || cost <= 0) return null;
  return (change / cost) * 100;
}

export function PositionsTable({ positions, loading, onPlaceOrder }) {
  const [closePosition, setClosePosition] = useState(null);
  const [closeBusy, setCloseBusy] = useState(false);

  async function handleCloseConfirm(orderInput) {
    if (!onPlaceOrder) {
      throw new Error('Order placement is unavailable');
    }
    setCloseBusy(true);
    try {
      await onPlaceOrder(orderInput);
    } finally {
      setCloseBusy(false);
    }
  }

  if (loading && !positions?.length) {
    return <p className="paper-empty">Loading positions…</p>;
  }

  if (!positions?.length) {
    return (
      <div className="paper-empty">
        <p>No open positions</p>
        <p className="paper-empty__hint">Search a symbol and place a buy order to get started.</p>
      </div>
    );
  }

  return (
    <>
      <div className="paper-table-wrap">
        <table className="paper-table paper-table--positions">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Long qty</th>
              <th>Short qty</th>
              <th>Net qty</th>
              <th>Avg long</th>
              <th>Avg short</th>
              <th>Last price</th>
              <th>Cost basis</th>
              <th>Change</th>
              <th>Chg %</th>
              <th title="Long MV minus short liability">Net market value</th>
              <th>Unrealized P&amp;L</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {positions.map((p) => {
              const lastPrice = p.current_price;
              const costBasis = positionCostBasis(p);
              const changePerShare = positionChangePerShare(p);
              const changePct = positionChangePct(p);
              const closableLegs = getClosableLegs(p);
              const canClose = closableLegs.length > 0 && onPlaceOrder;
              return (
                <tr key={p.id || p.ticker}>
                  <td className="paper-table__sym">{p.ticker}</td>
                  <td>{p.long_qty ?? 0}</td>
                  <td>{p.short_qty ?? 0}</td>
                  <td>{p.net_qty ?? 0}</td>
                  <td>{money(p.avg_long_cost)}</td>
                  <td>{money(p.avg_short_cost)}</td>
                  <td>{money(lastPrice)}</td>
                  <td>{money(costBasis)}</td>
                  <td className={toneClass(changePerShare)}>
                    {changePerShare != null ? fmtAbsSigned(changePerShare) : '—'}
                  </td>
                  <td className={toneClass(changePct)}>
                    {changePct != null ? fmtPctSigned(changePct) : '—'}
                  </td>
                  <td className={toneClass(p.market_value)}>
                    {money(p.market_value)}
                    {Number(p.short_qty) > 0 && Number(p.long_qty) > 0 ? (
                      <span className="paper-table__sub">
                        L {money(p.long_market_value)} · S −{money(p.short_market_value)}
                      </span>
                    ) : null}
                  </td>
                  <td className={toneClass(p.unrealized_pnl)}>
                    {money(p.unrealized_pnl)}
                    <span className="paper-table__sub">
                      {changePct != null ? fmtPctSigned(changePct) : ''}
                    </span>
                  </td>
                  <td className="paper-table__actions">
                    {canClose ? (
                      <button
                        type="button"
                        className="paper-close-pos-btn"
                        onClick={() => setClosePosition(p)}
                        title={`Close ${p.ticker} position`}
                      >
                        Close
                      </button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ClosePositionModal
        open={closePosition != null}
        position={closePosition}
        onClose={() => {
          if (!closeBusy) setClosePosition(null);
        }}
        onConfirm={handleCloseConfirm}
        busy={closeBusy}
      />
    </>
  );
}
