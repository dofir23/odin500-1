import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiUrl } from '../../utils/apiOrigin.js';
import { fetchWithAuth } from '../../store/apiStore.js';
import { useLoginGateOptional } from '../../context/LoginGateContext.jsx';
import { useIsLoggedIn } from '../../hooks/useIsLoggedIn.js';
import { usePaperAccount } from '../../hooks/usePaperAccount.js';
import { usePaperPositions } from '../../hooks/usePaperPositions.js';
import { usePaperOrders } from '../../hooks/usePaperOrders.js';
import { AccountSummary, VirtualMoneyBadge } from '../../components/paper/AccountSummary.jsx';
import { OrderTicket } from '../../components/paper/OrderTicket.jsx';
import { PositionsTable } from '../../components/paper/PositionsTable.jsx';
import { OrdersTable } from '../../components/paper/OrdersTable.jsx';
import { EquityCurve } from '../../components/paper/EquityCurve.jsx';
import '../../styles/paper-trading.css';

function PaperTradingPageContent() {
  const { account, loading: accountLoading, error: accountError, refetch: refetchAccount, resetPortfolio } =
    usePaperAccount();
  const { positions, loading: positionsLoading, refetch: refetchPositions } = usePaperPositions();
  const { orders, loading: ordersLoading, placeOrder, cancelOrder } = usePaperOrders();
  const [tab, setTab] = useState('positions');
  const [history, setHistory] = useState([]);
  const [resetting, setResetting] = useState(false);

  const pendingCount = useMemo(() => orders.filter((o) => o.status === 'pending').length, [orders]);

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetchWithAuth(apiUrl('/api/paper/portfolio/history'), { method: 'GET' });
      const payload = await res.json().catch(() => ({}));
      if (res.ok) setHistory(payload.history || []);
    } catch {
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const handleOrderPlaced = useCallback(async () => {
    await Promise.all([refetchAccount(), refetchPositions(), loadHistory()]);
  }, [refetchAccount, refetchPositions, loadHistory]);

  const handlePlaceOrder = useCallback(
    async (input) => {
      const result = await placeOrder(input);
      await handleOrderPlaced();
      return result;
    },
    [placeOrder, handleOrderPlaced]
  );

  async function handleReset() {
    if (!window.confirm('Reset to $100,000 virtual cash and clear all positions and pending orders?')) {
      return;
    }
    setResetting(true);
    try {
      await resetPortfolio();
      await refetchPositions();
      await loadHistory();
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="paper-page odin-content-page">
      <header className="paper-header">
        <div>
          <div className="paper-header__title-row">
            <h1 className="paper-header__title">Paper Trading</h1>
            <VirtualMoneyBadge />
          </div>
          <p className="paper-header__sub">
            Simulate trades with $100,000 virtual capital. Market orders fill at the latest Odin daily close with
            realistic slippage.
          </p>
        </div>
        <div className="paper-header__actions">
          <button
            type="button"
            className="paper-btn paper-btn--ghost paper-btn--danger"
            disabled={resetting || accountLoading}
            onClick={() => void handleReset()}
          >
            {resetting ? 'Resetting…' : 'Reset portfolio'}
          </button>
        </div>
      </header>

      {accountError ? <div className="paper-alert paper-alert--error">{accountError}</div> : null}

      <AccountSummary account={account} loading={accountLoading} />

      <div className="paper-layout">
        <aside className="paper-layout__ticket">
          <OrderTicket onPlaceOrder={handlePlaceOrder} positions={positions} />
        </aside>

        <div className="paper-layout__main">
          <EquityCurve history={history} />

          <section className="paper-card paper-blotter">
            <div className="paper-card__head paper-card__head--tabs">
              <div className="paper-tabs" role="tablist" aria-label="Holdings and orders">
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === 'positions'}
                  className={'paper-tabs__btn' + (tab === 'positions' ? ' paper-tabs__btn--active' : '')}
                  onClick={() => setTab('positions')}
                >
                  Positions
                  <span className="paper-tabs__count">{positions.length}</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === 'orders'}
                  className={'paper-tabs__btn' + (tab === 'orders' ? ' paper-tabs__btn--active' : '')}
                  onClick={() => setTab('orders')}
                >
                  Orders
                  <span className="paper-tabs__count">{orders.length}</span>
                  {pendingCount > 0 ? (
                    <span className="paper-tabs__count paper-tabs__pending">
                      ({pendingCount} pending)
                    </span>
                  ) : null}
                </button>
              </div>
            </div>
            <div className="paper-card__body">
              {tab === 'positions' ? (
                <PositionsTable positions={positions} loading={positionsLoading} />
              ) : (
                <OrdersTable
                  orders={orders}
                  loading={ordersLoading}
                  onCancel={async (id) => {
                    await cancelOrder(id);
                    await refetchAccount();
                  }}
                />
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

/** Same login modal as watchlist (`LoginGateProvider` / `LoginRequiredModal`). */
export default function PaperTradingPage() {
  const navigate = useNavigate();
  const loginGate = useLoginGateOptional();
  const loggedIn = useIsLoggedIn();

  useEffect(() => {
    if (loggedIn) return;
    loginGate?.showLoginRequired({
      onDismiss: () => {
        if (window.history.length > 1) navigate(-1);
        else navigate('/market', { replace: true });
      }
    });
  }, [loggedIn, loginGate, navigate]);

  if (!loggedIn) {
    return null;
  }

  return <PaperTradingPageContent />;
}
