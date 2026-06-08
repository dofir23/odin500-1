import React, { Suspense, lazy } from 'react';
import { useLocation } from 'react-router-dom';
import { PageRouteFallback } from './components/PageRouteFallback.jsx';
import { RouteErrorBoundary } from './components/RouteErrorBoundary.jsx';
import { LoginGateProvider } from './context/LoginGateContext.jsx';
import { EngagementProvider } from './context/EngagementContext.jsx';
import { WatchlistDockProvider } from './context/WatchlistDockContext.jsx';
import { createAppRoutes } from './appRoutes.jsx';
import { lazyWithRetry } from './utils/lazyWithRetry.js';
import App from './App.jsx';

const lazyPage = (loader) => lazy(() => lazyWithRetry(loader));

const LoginPage = lazyPage(() => import('./pages/LoginPage.jsx'));
const ForgotPasswordPage = lazyPage(() => import('./pages/ForgotPasswordPage.jsx'));
const SignupPage = lazyPage(() => import('./pages/SignupPage.jsx'));
const AuthCallbackPage = lazyPage(() => import('./pages/AuthCallbackPage.jsx'));
const SignupVerifyEmailPage = lazyPage(() => import('./pages/SignupVerifyEmailPage.jsx'));
const SignupEnterCodePage = lazyPage(() => import('./pages/SignupEnterCodePage.jsx'));
const SignupUsernamePage = lazyPage(() => import('./pages/SignupUsernamePage.jsx'));
const MarketHeatmapPage = lazyPage(() => import('./pages/MarketHeatmapPage.jsx'));
const OdinSignalsPage = lazyPage(() => import('./pages/OdinSignalsPage.jsx'));
const TickerPage = lazyPage(() => import('./pages/TickerPage.jsx'));
const IndexPage = lazyPage(() => import('./pages/IndexPage.jsx'));
const MarketMoversPage = lazyPage(() => import('./pages/MarketMoversPage.jsx'));
const StatisticDataPage = lazyPage(() => import('./pages/StatisticDataPage.jsx'));
const ReturnTablePage = lazyPage(() => import('./pages/ReturnTablePage.jsx'));
const TickerAnnualPage = lazyPage(() => import('./pages/TickerAnnualPage.jsx'));
const TickerQuarterlyPage = lazyPage(() => import('./pages/TickerQuarterlyPage.jsx'));
const TickerMonthlyPage = lazyPage(() => import('./pages/TickerMonthlyPage.jsx'));
const TickerWeeklyPage = lazyPage(() => import('./pages/TickerWeeklyPage.jsx'));
const TickerDailyPage = lazyPage(() => import('./pages/TickerDailyPage.jsx'));
const RelativeStrengthTickerPage = lazyPage(() => import('./pages/RelativeStrengthTickerPage.jsx'));
const HistoricalDataPage = lazyPage(() => import('./pages/HistoricalDataPage.jsx'));
const TickerReportPage = lazyPage(() => import('./pages/TickerReportPage.jsx'));
const NewsPage = lazyPage(() => import('./pages/NewsPage.jsx'));
const Pricing = lazyPage(() => import('./pages/Pricing.jsx'));
const AboutPage = lazyPage(() => import('./pages/AboutPage.jsx'));
const AccountsPage = lazyPage(() => import('./pages/AccountsPage.jsx'));
const PaperTradingPage = lazyPage(() => import('./pages/PaperTrading/PaperTradingPage.jsx'));

const lazyPages = {
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
  PaperTradingPage
};

function ClientAppRoutes() {
  return createAppRoutes(lazyPages);
}

export function AppShell({ ssr = false, routesElement = null }) {
  const { pathname } = useLocation();
  const routes = routesElement ?? <ClientAppRoutes />;
  return (
    <LoginGateProvider>
      <EngagementProvider>
        <WatchlistDockProvider>
          <RouteErrorBoundary resetKey={pathname}>
            <Suspense fallback={ssr ? null : <PageRouteFallback />}>{routes}</Suspense>
          </RouteErrorBoundary>
        </WatchlistDockProvider>
      </EngagementProvider>
    </LoginGateProvider>
  );
}
