import React, { Suspense, lazy } from 'react';
import { useLocation } from 'react-router-dom';
import { PageRouteFallback } from './components/PageRouteFallback.jsx';
import { RouteErrorBoundary } from './components/RouteErrorBoundary.jsx';
import { createAppRoutes } from './appRoutes.jsx';

const App = lazy(() => import('./App.jsx'));
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage.jsx'));
const SignupPage = lazy(() => import('./pages/SignupPage.jsx'));
const AuthCallbackPage = lazy(() => import('./pages/AuthCallbackPage.jsx'));
const SignupVerifyEmailPage = lazy(() => import('./pages/SignupVerifyEmailPage.jsx'));
const SignupEnterCodePage = lazy(() => import('./pages/SignupEnterCodePage.jsx'));
const SignupUsernamePage = lazy(() => import('./pages/SignupUsernamePage.jsx'));
const MarketHeatmapPage = lazy(() => import('./pages/MarketHeatmapPage.jsx'));
const OdinSignalsPage = lazy(() => import('./pages/OdinSignalsPage.jsx'));
const TickerPage = lazy(() => import('./pages/TickerPage.jsx'));
const IndexPage = lazy(() => import('./pages/IndexPage.jsx'));
const MarketMoversPage = lazy(() => import('./pages/MarketMoversPage.jsx'));
const StatisticDataPage = lazy(() => import('./pages/StatisticDataPage.jsx'));
const ReturnTablePage = lazy(() => import('./pages/ReturnTablePage.jsx'));
const TickerAnnualPage = lazy(() => import('./pages/TickerAnnualPage.jsx'));
const TickerQuarterlyPage = lazy(() => import('./pages/TickerQuarterlyPage.jsx'));
const TickerMonthlyPage = lazy(() => import('./pages/TickerMonthlyPage.jsx'));
const TickerWeeklyPage = lazy(() => import('./pages/TickerWeeklyPage.jsx'));
const TickerDailyPage = lazy(() => import('./pages/TickerDailyPage.jsx'));
const RelativeStrengthTickerPage = lazy(() => import('./pages/RelativeStrengthTickerPage.jsx'));
const HistoricalDataPage = lazy(() => import('./pages/HistoricalDataPage.jsx'));
const TickerReportPage = lazy(() => import('./pages/TickerReportPage.jsx'));
const NewsPage = lazy(() => import('./pages/NewsPage.jsx'));
const Pricing = lazy(() => import('./pages/Pricing.jsx'));
const AboutPage = lazy(() => import('./pages/AboutPage.jsx'));
const AccountsPage = lazy(() => import('./pages/AccountsPage.jsx'));

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
  AccountsPage
};

function ClientAppRoutes() {
  return createAppRoutes(lazyPages);
}

export function AppShell({ ssr = false, routesElement = null }) {
  const { pathname } = useLocation();
  const routes = routesElement ?? <ClientAppRoutes />;
  return (
    <RouteErrorBoundary resetKey={pathname}>
      {ssr ? routes : <Suspense fallback={<PageRouteFallback />}>{routes}</Suspense>}
    </RouteErrorBoundary>
  );
}
