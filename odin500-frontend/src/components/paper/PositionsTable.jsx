import { fmtPctSigned } from '../../utils/formatDisplayNumber.js';

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

export function PositionsTable({ positions, loading }) {
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
    <div className="paper-table-wrap">
      <table className="paper-table">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Long qty</th>
            <th>Short qty</th>
            <th>Net qty</th>
            <th>Avg long</th>
            <th>Avg short</th>
            <th>Last</th>
            <th title="Long MV minus short liability">Net market value</th>
            <th>Unrealized P&L</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((p) => (
            <tr key={p.id || p.ticker}>
              <td className="paper-table__sym">{p.ticker}</td>
              <td>{p.long_qty ?? 0}</td>
              <td>{p.short_qty ?? 0}</td>
              <td>{p.net_qty ?? 0}</td>
              <td>{money(p.avg_long_cost)}</td>
              <td>{money(p.avg_short_cost)}</td>
              <td>{money(p.current_price)}</td>
              <td className={toneClass(p.market_value)}>
                {money(p.market_value)}
                {Number(p.short_qty) > 0 && Number(p.long_qty) > 0 ? (
                  <span style={{ display: 'block', fontSize: '0.7rem', opacity: 0.85 }}>
                    L {money(p.long_market_value)} · S −{money(p.short_market_value)}
                  </span>
                ) : null}
              </td>
              <td className={toneClass(p.unrealized_pnl)}>
                {money(p.unrealized_pnl)}
                <span style={{ marginLeft: '0.35rem', fontSize: '0.75rem' }}>
                  {p.unrealized_pnl_pct != null ? fmtPctSigned(p.unrealized_pnl_pct) : ''}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
