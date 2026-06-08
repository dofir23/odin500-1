import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiUrl } from '../../utils/apiOrigin.js';
import { fetchWithAuth } from '../../store/apiStore.js';
import { useLoginGateOptional } from '../../context/LoginGateContext.jsx';
import { useIsLoggedIn } from '../../hooks/useIsLoggedIn.js';
import { usePaperAccount } from '../../hooks/usePaperAccount.js';
import { usePaperPositions } from '../../hooks/usePaperPositions.js';
import { usePaperOrders } from '../../hooks/usePaperOrders.js';
import { usePaperClosedTrades } from '../../hooks/usePaperClosedTrades.js';
import { AccountSummary } from '../../components/paper/AccountSummary.jsx';
import { OrderTicket } from '../../components/paper/OrderTicket.jsx';
import { PositionsTable } from '../../components/paper/PositionsTable.jsx';
import { OrdersTable } from '../../components/paper/OrdersTable.jsx';
import { ClosedTradesTable } from '../../components/paper/ClosedTradesTable.jsx';
import { EquityCurve } from '../../components/paper/EquityCurve.jsx';
import { PortfolioInsightsPanel } from '../../components/paper/PortfolioInsightsPanel.jsx';
import { ThemedDropdown } from '../../components/ThemedDropdown.jsx';
import { PaperManageModal } from '../../components/paper/PaperManageModal.jsx';
import { StrategyPanel } from '../../components/paper/StrategyPanel.jsx';
import { StrategyAccountWizard } from '../../components/paper/StrategyAccountWizard.jsx';
import { usePaperStrategy } from '../../hooks/usePaperStrategy.js';
import { ProductTourProvider, useProductTourContext } from '../../context/ProductTourContext.jsx';
import { isTourSkipped, TOUR_IDS } from '../../engagement/tourStorage.js';
import '../../styles/paper-trading.css';

function PaperTradingPageContent() {
  const {
    account,
    accounts,
    activeAccountId,
    setActiveAccountId,
    loading: accountLoading,
    error: accountError,
    refetch: refetchAccount,
    resetPortfolio,
    createAccount,
    deleteAccount
  } = usePaperAccount();
  const { positions, loading: positionsLoading, refetch: refetchPositions } = usePaperPositions({
    accountId: activeAccountId
  });
  const { orders, loading: ordersLoading, placeOrder, cancelOrder, refetch: refetchOrders } = usePaperOrders({
    accountId: activeAccountId
  });
  const { trades: closedTrades, totals: closedTotals, loading: closedLoading, refetch: refetchClosed } =
    usePaperClosedTrades({ accountId: activeAccountId });
  const {
    strategy,
    binding,
    rules,
    executionLog,
    strategyActive,
    automatedAccountIds,
    loading: strategyLoading,
    error: strategyError,
    refetch: refetchStrategy,
    createStrategy,
    addRule,
    updateRule,
    deleteRule,
    bindStrategy,
    patchBinding,
    patchStrategy,
    runOnce
  } = usePaperStrategy(activeAccountId);
  const [tab, setTab] = useState('positions');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [resetting, setResetting] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [modal, setModal] = useState(null);
  const [newAccountName, setNewAccountName] = useState('');
  const [modalBusy, setModalBusy] = useState(false);
  const [modalError, setModalError] = useState('');
  const { startPaperStrategyManageTour, registerManageTourPrepare } = useProductTourContext();

  useEffect(() => {
    registerManageTourPrepare(() => {
      setTab('strategy');
      window.requestAnimationFrame(() => {
        document
          .querySelector('[data-tour="paper-strategy-panel-intro"]')
          ?.scrollIntoView({ behavior: 'auto', block: 'start' });
      });
    });
  }, [registerManageTourPrepare]);

  const pendingCount = useMemo(() => orders.filter((o) => o.status === 'pending').length, [orders]);

  const accountOptions = useMemo(
    () =>
      (accounts || []).map((a) => {
        const base = String(a.name || 'Account').trim() || 'Account';
        const auto = automatedAccountIds.has(a.id);
        return auto ? { id: a.id, label: base, tag: 'auto' } : { id: a.id, label: base };
      }),
    [accounts, automatedAccountIds]
  );

  const showStrategyTab = !!strategy || tab === 'strategy';

  const selectedAccountId = activeAccountId || accountOptions[0]?.id || '';

  const selectedAccountLabel =
    accountOptions.find((o) => o.id === selectedAccountId)?.label || account?.name || 'this account';

  function closeModal() {
    setModal(null);
    setModalError('');
    setNewAccountName('');
    setModalBusy(false);
  }

  function openCreateModal() {
    setModalError('');
    setNewAccountName('');
    setModal('create');
  }

  function openResetModal() {
    setModalError('');
    setModal('reset');
  }

  function openDeleteModal() {
    setModalError('');
    setModal('delete');
  }

  const loadHistory = useCallback(async () => {
    try {
      const endpoint = activeAccountId
        ? `/api/paper/portfolio/history?account_id=${encodeURIComponent(activeAccountId)}`
        : '/api/paper/portfolio/history';
      const res = await fetchWithAuth(apiUrl(endpoint), { method: 'GET' });
      const payload = await res.json().catch(() => ({}));
      if (res.ok) setHistory(payload.history || []);
    } catch {
      setHistory([]);
    }
  }, [activeAccountId]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const handleOrderPlaced = useCallback(async () => {
    await Promise.all([refetchAccount(), refetchPositions(), refetchClosed(), loadHistory()]);
  }, [refetchAccount, refetchPositions, refetchClosed, loadHistory]);

  const handlePlaceOrder = useCallback(
    async (input) => {
      const result = await placeOrder(input);
      await handleOrderPlaced();
      return result;
    },
    [placeOrder, handleOrderPlaced]
  );

  async function submitCreateAccount() {
    const name = newAccountName.trim();
    if (!name) {
      setModalError('Enter an account name');
      return;
    }
    setModalBusy(true);
    setModalError('');
    try {
      await createAccount({ name });
      closeModal();
    } catch (err) {
      setModalError(err?.message || 'Failed to create account');
    } finally {
      setModalBusy(false);
    }
  }

  async function submitResetPortfolio() {
    setResetting(true);
    setModalBusy(true);
    setModalError('');
    try {
      await resetPortfolio();
      closeModal();
      await refetchPositions();
      await loadHistory();
    } catch (err) {
      setModalError(err?.message || 'Failed to reset portfolio');
    } finally {
      setResetting(false);
      setModalBusy(false);
    }
  }

  async function submitDeleteAccount() {
    if (!selectedAccountId) return;
    setDeletingAccount(true);
    setModalBusy(true);
    setModalError('');
    try {
      await deleteAccount(selectedAccountId);
      closeModal();
    } catch (err) {
      setModalError(err?.message || 'Failed to delete account');
    } finally {
      setDeletingAccount(false);
      setModalBusy(false);
    }
  }

  return (
    <div className="paper-page odin-content-page">
      <header className="paper-header">
        <div>
          <div className="paper-header__title-row">
            <h1 className="paper-header__title">Paper Trading</h1>
            {strategy ? (
              <button
                type="button"
                className="paper-btn paper-btn--ghost paper-header__tour-btn"
                onClick={() => startPaperStrategyManageTour()}
              >
                Take tour
              </button>
            ) : null}
          </div>
          <p className="paper-header__sub">
            Simulate trades with $100,000 virtual capital. Market orders fill at the latest Odin daily close with
            realistic slippage.
          </p>
        </div>
        <div className="paper-header__actions">
          <div data-tour="paper-account-dd">
            <ThemedDropdown
              className="paper-header__account-dd"
              value={selectedAccountId}
              options={accountOptions}
              onChange={setActiveAccountId}
              title="Paper account"
              ariaLabelPrefix="Paper account"
              labelFallback="Select account"
              wideLabel
              disabled={accountLoading || accountOptions.length === 0}
            />
          </div>
          <div className="paper-header__btn-row">
            <button type="button" className="paper-btn paper-btn--ghost" onClick={openCreateModal}>
              New account
            </button>
            <button
              type="button"
              className="paper-btn paper-btn--ghost"
              data-tour="paper-new-strategy-account"
              onClick={() => setWizardOpen(true)}
            >
              New strategy account
            </button>
            <button
              type="button"
              className="paper-btn paper-btn--ghost paper-btn--danger"
              disabled={resetting || accountLoading}
              onClick={openResetModal}
            >
              {resetting ? 'Resetting…' : 'Reset portfolio'}
            </button>
            <button
              type="button"
              className="paper-btn paper-btn--danger"
              disabled={
                deletingAccount || accountLoading || !selectedAccountId || (accounts?.length ?? 0) <= 1
              }
              title={
                (accounts?.length ?? 0) <= 1 ? 'Keep at least one paper trading account' : undefined
              }
              onClick={openDeleteModal}
            >
              {deletingAccount ? 'Deleting…' : 'Delete account'}
            </button>
          </div>
        </div>
      </header>

      <PaperManageModal
        open={modal === 'create'}
        title="New paper account"
        titleId="paper-create-account-title"
        onClose={closeModal}
        footer={
          <>
            <button
              type="button"
              className="wl-manage-btn wl-manage-btn--ghost"
              onClick={closeModal}
              disabled={modalBusy}
            >
              Cancel
            </button>
            <button
              type="button"
              className="wl-manage-btn wl-manage-btn--primary"
              onClick={() => void submitCreateAccount()}
              disabled={modalBusy}
            >
              {modalBusy ? 'Creating…' : 'Create'}
            </button>
          </>
        }
      >
        <label className="wl-manage-label" htmlFor="paper-create-account-name">
          Name
        </label>
        <input
          id="paper-create-account-name"
          type="text"
          className="wl-manage-input"
          value={newAccountName}
          onChange={(e) => setNewAccountName(e.target.value)}
          placeholder="e.g. Growth strategy"
          disabled={modalBusy}
          autoComplete="off"
          onKeyDown={(e) => {
            if (e.key === 'Enter') void submitCreateAccount();
          }}
        />
        {modalError ? <p className="wl-manage-err">{modalError}</p> : null}
      </PaperManageModal>

      <PaperManageModal
        open={modal === 'reset'}
        title="Reset portfolio"
        titleId="paper-reset-portfolio-title"
        onClose={closeModal}
        footer={
          <>
            <button
              type="button"
              className="wl-manage-btn wl-manage-btn--ghost"
              onClick={closeModal}
              disabled={modalBusy}
            >
              Cancel
            </button>
            <button
              type="button"
              className="wl-manage-btn wl-manage-btn--danger"
              onClick={() => void submitResetPortfolio()}
              disabled={modalBusy}
            >
              {modalBusy ? 'Resetting…' : 'Reset'}
            </button>
          </>
        }
      >
        <p className="paper-modal-msg">
          Reset <strong>{selectedAccountLabel}</strong> to $100,000 virtual cash and clear all positions and
          pending orders? This cannot be undone.
        </p>
        {modalError ? <p className="wl-manage-err">{modalError}</p> : null}
      </PaperManageModal>

      <PaperManageModal
        open={modal === 'delete'}
        title="Delete account"
        titleId="paper-delete-account-title"
        onClose={closeModal}
        footer={
          <>
            <button
              type="button"
              className="wl-manage-btn wl-manage-btn--ghost"
              onClick={closeModal}
              disabled={modalBusy}
            >
              Cancel
            </button>
            <button
              type="button"
              className="wl-manage-btn wl-manage-btn--danger"
              onClick={() => void submitDeleteAccount()}
              disabled={modalBusy || !selectedAccountId}
            >
              {modalBusy ? 'Deleting…' : 'Delete'}
            </button>
          </>
        }
      >
        <p className="paper-modal-msg">
          Permanently delete <strong>{selectedAccountLabel}</strong>? All positions, orders, fills, and history for
          this account will be removed.
        </p>
        {modalError ? <p className="wl-manage-err">{modalError}</p> : null}
      </PaperManageModal>

      <StrategyAccountWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        createAccount={createAccount}
        createStrategy={createStrategy}
        addRule={addRule}
        bindStrategy={bindStrategy}
        onComplete={async ({ accountId }) => {
          setActiveAccountId(accountId);
          setTab('strategy');
          await Promise.all([refetchAccount(accountId), refetchStrategy(accountId)]);
          if (!isTourSkipped(TOUR_IDS.PAPER_STRATEGY_MANAGE)) {
            window.setTimeout(() => startPaperStrategyManageTour(), 750);
          }
        }}
      />

      {accountError ? <div className="paper-alert paper-alert--error">{accountError}</div> : null}

      <AccountSummary account={account} loading={accountLoading} />

      <div className="paper-layout">
        <aside className="paper-layout__ticket">
          <OrderTicket
            onPlaceOrder={handlePlaceOrder}
            positions={positions}
            strategyActive={strategyActive}
          />
        </aside>

        <div className="paper-layout__main">
          <EquityCurve history={history} />
          <PortfolioInsightsPanel
            account={account}
            positions={positions}
            pendingCount={pendingCount}
            closedTradesCount={closedTrades.length}
            strategyActive={strategyActive}
            showStrategyTab={showStrategyTab}
            loading={accountLoading || positionsLoading}
            onSetupStrategy={() => setWizardOpen(true)}
          />
        </div>
      </div>

      <section className="paper-card paper-blotter">
        <div className="paper-card__head paper-card__head--tabs">
          <div className="paper-blotter-tabs-row" data-tour="paper-blotter-tabs-row">
            <div className="paper-tabs paper-tabs--scroll" role="tablist" aria-label="Holdings and orders">
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === 'positions'}
                  data-tour="paper-tab-positions"
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
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === 'closed'}
                  className={'paper-tabs__btn' + (tab === 'closed' ? ' paper-tabs__btn--active' : '')}
                  onClick={() => setTab('closed')}
                >
                  Closed trades
                  <span className="paper-tabs__count">{closedTrades.length}</span>
                </button>
                {showStrategyTab ? (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={tab === 'strategy'}
                    data-tour="paper-tab-strategy"
                    className={'paper-tabs__btn' + (tab === 'strategy' ? ' paper-tabs__btn--active' : '')}
                    onClick={() => setTab('strategy')}
                  >
                    Strategy
                    {strategyActive ? (
                      <span className="wl-flyout__select-item-tag wl-flyout__select-item-tag--auto paper-tabs__auto-tag">
                        Auto
                      </span>
                    ) : null}
                  </button>
                ) : (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={false}
                    className="paper-tabs__btn paper-tabs__btn--setup"
                    onClick={() => setWizardOpen(true)}
                  >
                    Set up automation
                  </button>
                )}
              </div>
          </div>
        </div>
            <div className="paper-card__body">
              {tab === 'strategy' ? (
                <StrategyPanel
                  strategy={strategy}
                  binding={binding}
                  rules={rules}
                  executionLog={executionLog}
                  strategyActive={strategyActive}
                  loading={strategyLoading}
                  error={strategyError}
                  onAddRule={(payload) => addRule(strategy.id, payload)}
                  onUpdateRule={(ruleId, payload) => updateRule(strategy.id, ruleId, payload)}
                  onDeleteRule={(ruleId) => deleteRule(strategy.id, ruleId)}
                  onPatchStrategy={(patch) => patchStrategy(strategy.id, patch)}
                  onToggleActive={async (active) => {
                    await patchBinding(strategy.id, activeAccountId, { is_active: active });
                    await patchStrategy(strategy.id, { is_active: active });
                  }}
                  onRunOnce={() => runOnce(activeAccountId)}
                  onRefetch={async () => {
                    await Promise.all([refetchStrategy(), refetchAccount(), refetchOrders()]);
                  }}
                />
              ) : tab === 'positions' ? (
                <PositionsTable positions={positions} loading={positionsLoading} />
              ) : tab === 'closed' ? (
                <ClosedTradesTable trades={closedTrades} totals={closedTotals} loading={closedLoading} />
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

  return (
    <ProductTourProvider>
      <PaperTradingPageContent />
    </ProductTourProvider>
  );
}
