function formatTime(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return iso;
  }
}

function money(v) {
  if (v == null || v === '—' || Number.isNaN(Number(v))) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(
    Number(v)
  );
}

function SidePill({ side }) {
  const s = String(side).toLowerCase();
  return <span className={'paper-side-pill paper-side-pill--' + s}>{s}</span>;
}

function StatusPill({ status }) {
  const s = String(status || '').toLowerCase();
  return <span className={'paper-status paper-status--' + s}>{status}</span>;
}

export function OrdersTable({ orders, loading, onCancel }) {
  const pending = (orders || []).filter((o) => o.status === 'pending');
  const history = (orders || []).filter((o) => o.status !== 'pending');

  function renderRow(o) {
    const price =
      o.order_type === 'limit' && o.limit_price != null
        ? o.limit_price
        : o.avg_fill_price != null
          ? o.avg_fill_price
          : null;
    return (
      <tr key={o.id}>
        <td>
          <SidePill side={o.side} />
        </td>
        <td className="paper-table__sym">{o.ticker}</td>
        <td>{o.qty}</td>
        <td style={{ textTransform: 'capitalize' }}>{o.order_type}</td>
        <td>{price != null ? money(price) : '—'}</td>
        <td>
          <StatusPill status={o.status} />
        </td>
        <td>{formatTime(o.filled_at || o.submitted_at)}</td>
        <td>
          {o.status === 'pending' && onCancel ? (
            <button type="button" className="paper-cancel-btn" onClick={() => void onCancel(o.id)}>
              Cancel
            </button>
          ) : null}
        </td>
      </tr>
    );
  }

  const head = (
    <thead>
      <tr>
        <th>Side</th>
        <th>Symbol</th>
        <th>Qty</th>
        <th>Type</th>
        <th>Price</th>
        <th>Status</th>
        <th>Time</th>
        <th />
      </tr>
    </thead>
  );

  return (
    <div className="paper-orders-panel">
      <h3 className="paper-section-title">Pending</h3>
      {loading && !pending.length ? (
        <p className="paper-empty">Loading orders…</p>
      ) : !pending.length ? (
        <p className="paper-empty">No pending orders</p>
      ) : (
        <div className="paper-table-wrap">
          <table className="paper-table">
            {head}
            <tbody>{pending.map(renderRow)}</tbody>
          </table>
        </div>
      )}

      <h3 className="paper-section-title">History</h3>
      {!history.length ? (
        <p className="paper-empty">No filled or cancelled orders yet</p>
      ) : (
        <div className="paper-table-wrap">
          <table className="paper-table">
            {head}
            <tbody>{history.map(renderRow)}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
