import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { ProtectedLayout } from './components/ProtectedLayout.jsx';
import { isAuthDisabled } from './store/apiStore.js';
import { buildRelativePerformanceTickerHref } from './utils/relativeStrengthNavigation.js';
import { DEFAULT_INDEX_ROUTE_SLUG, DEFAULT_TICKER_ROUTE_SYMBOL, sanitizeTickerPageInput } from './utils/tickerUrlSync.js';

const AUTH_DISABLED = isAuthDisabled();

/** Old `/ticker-annual/SYM` (etc.) → `/statistic/ticker-annual/SYM` */
function LegacyTickerStatRedirect({ kind }) {
  const { symbol } = useParams();
  const sym = symbol || DEFAULT_TICKER_ROUTE_SYMBOL;
  return <Navigate to={`/statistic/${kind}/${encodeURIComponent(sym)}`} replace />;
}

/** `/relative-strength/ticker` (+ optional `?ticker=` or `:symbol`) → `/relative-performance/ticker/SYM`. */
function LegacyRelativeStrengthRedirect() {
  const { symbol } = useParams();
  const [searchParams] = useSearchParams();
  const fromQuery =
    searchParams.get('tickers') || searchParams.get('ticker') || searchParams.get('symbol') || '';
  const fromPath = symbol ? decodeURIComponent(symbol) : '';
  const combined = fromPath || fromQuery || DEFAULT_TICKER_ROUTE_SYMBOL;
  return <Navigate to={buildRelativePerformanceTickerHref(combined)} replace />;
}

function ProtectedRoute({ children }) {
  if (AUTH_DISABLED) return children;
  const { pathname } = useLocation();
  const allowPaperTradingShell = pathname === '/paper-trading';
  const [authState, setAuthState] = useState('pending');

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    setAuthState(token || allowPaperTradingShell ? 'allowed' : 'denied');
  }, [allowPaperTradingShell, pathname]);

  if (typeof window === 'undefined') {
    return children;
  }
  if (authState === 'denied') {
    return <Navigate to="/login" replace />;
  }
  return children;
}

/**
 * @param {{
 *   App: React.ComponentType,
 *   LoginPage: React.ComponentType,
 *   ForgotPasswordPage: React.ComponentType,
 *   SignupPage: React.ComponentType,
 *   AuthCallbackPage: React.ComponentType,
 *   SignupVerifyEmailPage: React.ComponentType,
 *   SignupEnterCodePage: React.ComponentType,
 *   SignupUsernamePage: React.ComponentType,
 *   MarketHeatmapPage: React.ComponentType,
 *   OdinSignalsPage: React.ComponentType,
 *   TickerPage: React.ComponentType,
 *   IndexPage: React.ComponentType,
 *   MarketMoversPage: React.ComponentType,
 *   StatisticDataPage: React.ComponentType,
 *   ReturnTablePage: React.ComponentType,
 *   TickerAnnualPage: React.ComponentType,
 *   TickerQuarterlyPage: React.ComponentType,
 *   TickerMonthlyPage: React.ComponentType,
 *   TickerWeeklyPage: React.ComponentType,
 *   TickerDailyPage: React.ComponentType,
 *   RelativeStrengthTickerPage: React.ComponentType,
 *   HistoricalDataPage: React.ComponentType,
 *   TickerReportPage: React.ComponentType,
 *   NewsPage: React.ComponentType,
 *   Pricing: React.ComponentType,
 *   AboutPage: React.ComponentType,
 *   AccountsPage: React.ComponentType,
 *   PaperTradingPage: React.ComponentType,
 *   StockSplitsPage: React.ComponentType
 * }} pages
 */
export function createAppRoutes(pages) {
  const {
    App,
    LoginPage,
    ForgotPasswordPage,
    SignupPage,
    AuthCallbackPage,
    SignupVerifyEmailPage,
    SignupEnterCodePage,
    SignupUsernamePage,
    MarketHeatmapPage,
    OdinSignalsPage,
    TickerPage,
    IndexPage,
    MarketMoversPage,
    StatisticDataPage,
    ReturnTablePage,
    TickerAnnualPage,
    TickerQuarterlyPage,
    TickerMonthlyPage,
    TickerWeeklyPage,
    TickerDailyPage,
    RelativeStrengthTickerPage,
    HistoricalDataPage,
    TickerReportPage,
    NewsPage,
    Pricing,
    AboutPage,
    AccountsPage,
    PaperTradingPage,
    StockSplitsPage
  } = pages;

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/signup/verify-email" element={<SignupVerifyEmailPage />} />
      <Route path="/signup/enter-code" element={<SignupEnterCodePage />} />
      <Route path="/signup/username" element={<SignupUsernamePage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route
        element={
          <ProtectedRoute>
            <ProtectedLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/market" element={<App />} />
        <Route path="/tickers" element={<Navigate to="/odin-signals" replace />} />
        <Route path="/ticker" element={<Navigate to={`/ticker/${DEFAULT_TICKER_ROUTE_SYMBOL}`} replace />} />
        <Route path="/ticker/:symbol" element={<TickerPage />} />
        <Route path="/indices" element={<Navigate to={`/indices/${DEFAULT_INDEX_ROUTE_SLUG}`} replace />} />
        <Route path="/indices/:indexSlug" element={<IndexPage />} />
        <Route path="/sector-data" element={<Navigate to="/sector-data/xlk" replace />} />
        <Route path="/sector-data/:sectorKey" element={<IndexPage />} />
        <Route path="/heatmap" element={<MarketHeatmapPage />} />
        <Route path="/market-movers" element={<MarketMoversPage />} />
        <Route path="/stock-splits" element={<StockSplitsPage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/odin-signals" element={<OdinSignalsPage />} />
        <Route path="/statistic-data" element={<StatisticDataPage />} />
        <Route path="/return-table" element={<ReturnTablePage />} />
        <Route
          path="/ticker-annual"
          element={<Navigate to={`/statistic/ticker-annual/${DEFAULT_TICKER_ROUTE_SYMBOL}`} replace />}
        />
        <Route path="/ticker-annual/:symbol" element={<LegacyTickerStatRedirect kind="ticker-annual" />} />
        <Route
          path="/ticker-quarterly"
          element={<Navigate to={`/statistic/ticker-quarterly/${DEFAULT_TICKER_ROUTE_SYMBOL}`} replace />}
        />
        <Route path="/ticker-quarterly/:symbol" element={<LegacyTickerStatRedirect kind="ticker-quarterly" />} />
        <Route
          path="/ticker-monthly"
          element={<Navigate to={`/statistic/ticker-monthly/${DEFAULT_TICKER_ROUTE_SYMBOL}`} replace />}
        />
        <Route path="/ticker-monthly/:symbol" element={<LegacyTickerStatRedirect kind="ticker-monthly" />} />
        <Route
          path="/ticker-weekly"
          element={<Navigate to={`/statistic/ticker-weekly/${DEFAULT_TICKER_ROUTE_SYMBOL}`} replace />}
        />
        <Route path="/ticker-weekly/:symbol" element={<LegacyTickerStatRedirect kind="ticker-weekly" />} />
        <Route
          path="/ticker-daily"
          element={<Navigate to={`/statistic/ticker-daily/${DEFAULT_TICKER_ROUTE_SYMBOL}`} replace />}
        />
        <Route path="/ticker-daily/:symbol" element={<LegacyTickerStatRedirect kind="ticker-daily" />} />
        <Route
          path="/statistic/ticker-annual"
          element={<Navigate to={`/statistic/ticker-annual/${DEFAULT_TICKER_ROUTE_SYMBOL}`} replace />}
        />
        <Route path="/statistic/ticker-annual/:symbol" element={<TickerAnnualPage />} />
        <Route
          path="/statistic/ticker-quarterly"
          element={<Navigate to={`/statistic/ticker-quarterly/${DEFAULT_TICKER_ROUTE_SYMBOL}`} replace />}
        />
        <Route path="/statistic/ticker-quarterly/:symbol" element={<TickerQuarterlyPage />} />
        <Route
          path="/statistic/ticker-monthly"
          element={<Navigate to={`/statistic/ticker-monthly/${DEFAULT_TICKER_ROUTE_SYMBOL}`} replace />}
        />
        <Route path="/statistic/ticker-monthly/:symbol" element={<TickerMonthlyPage />} />
        <Route
          path="/statistic/ticker-weekly"
          element={<Navigate to={`/statistic/ticker-weekly/${DEFAULT_TICKER_ROUTE_SYMBOL}`} replace />}
        />
        <Route path="/statistic/ticker-weekly/:symbol" element={<TickerWeeklyPage />} />
        <Route
          path="/statistic/ticker-daily"
          element={<Navigate to={`/statistic/ticker-daily/${DEFAULT_TICKER_ROUTE_SYMBOL}`} replace />}
        />
        <Route path="/statistic/ticker-daily/:symbol" element={<TickerDailyPage />} />
        <Route path="/relative-performance/ticker" element={<RelativeStrengthTickerPage />} />
        <Route path="/relative-performance/ticker/:symbol" element={<RelativeStrengthTickerPage />} />
        <Route path="/relative-strength/ticker" element={<LegacyRelativeStrengthRedirect />} />
        <Route path="/relative-strength/ticker/:symbol" element={<LegacyRelativeStrengthRedirect />} />
        <Route
          path="/historical-data"
          element={<Navigate to={`/historical-data/${DEFAULT_TICKER_ROUTE_SYMBOL.toLowerCase()}`} replace />}
        />
        <Route path="/historical-data/:symbol" element={<HistoricalDataPage />} />
        <Route
          path="/ticker-report"
          element={<Navigate to={`/ticker-report/${DEFAULT_TICKER_ROUTE_SYMBOL.toLowerCase()}`} replace />}
        />
        <Route path="/ticker-report/:symbol" element={<TickerReportPage />} />
        <Route path="/accounts" element={<AccountsPage />} />
        <Route path="/paper-trading" element={<PaperTradingPage />} />
        <Route path="/premium" element={<Pricing />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/pricing" />
      </Route>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Navigate to="/market" replace />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/market" replace />} />
    </Routes>
  );
}
