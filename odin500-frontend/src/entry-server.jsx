import './ssr-polyfills.js';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { AppShell } from './appRouter.jsx';
import { createAppRoutes } from './appRoutes.jsx';
import App from './App.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import AuthCallbackPage from './pages/AuthCallbackPage.jsx';
import SignupVerifyEmailPage from './pages/SignupVerifyEmailPage.jsx';
import SignupEnterCodePage from './pages/SignupEnterCodePage.jsx';
import SignupUsernamePage from './pages/SignupUsernamePage.jsx';
import MarketHeatmapPage from './pages/MarketHeatmapPage.jsx';
import OdinSignalsPage from './pages/OdinSignalsPage.jsx';
import TickerPage from './pages/TickerPage.jsx';
import IndexPage from './pages/IndexPage.jsx';
import MarketMoversPage from './pages/MarketMoversPage.jsx';
import StatisticDataPage from './pages/StatisticDataPage.jsx';
import TickerAnnualPage from './pages/TickerAnnualPage.jsx';
import TickerQuarterlyPage from './pages/TickerQuarterlyPage.jsx';
import TickerMonthlyPage from './pages/TickerMonthlyPage.jsx';
import TickerWeeklyPage from './pages/TickerWeeklyPage.jsx';
import TickerDailyPage from './pages/TickerDailyPage.jsx';
import RelativeStrengthTickerPage from './pages/RelativeStrengthTickerPage.jsx';
import HistoricalDataPage from './pages/HistoricalDataPage.jsx';
import NewsPage from './pages/NewsPage.jsx';
import Pricing from './pages/Pricing.jsx';
import AboutPage from './pages/AboutPage.jsx';
import AccountsPage from './pages/AccountsPage.jsx';

const eagerPages = {
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
  TickerAnnualPage,
  TickerQuarterlyPage,
  TickerMonthlyPage,
  TickerWeeklyPage,
  TickerDailyPage,
  RelativeStrengthTickerPage,
  HistoricalDataPage,
  NewsPage,
  Pricing,
  AboutPage,
  AccountsPage
};

const ssrRoutes = createAppRoutes(eagerPages);

/**
 * @param {string} url Request URL (path + optional query)
 * @returns {Promise<string>} HTML fragment for #root
 */
export async function render(url) {
  const pathname = String(url || '/').split('?')[0].split('#')[0] || '/';

  return renderToString(
    <StaticRouter location={pathname}>
      <AppShell ssr routesElement={ssrRoutes} />
    </StaticRouter>
  );
}
