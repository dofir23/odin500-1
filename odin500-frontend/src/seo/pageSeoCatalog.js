import { DEFAULT_SITE_DESCRIPTION, DEFAULT_SITE_TITLE } from './siteConfig.js';
import {
  STATIC_TITLES,
  historicalDataTitle,
  indexPageTitle,
  relativePerformanceTitle,
  sectorPageTitle,
  tickerPageTitle
} from './pageTitles.js';

/**
 * Static SEO copy for prerender shells and documentation.
 * Dynamic pages set titles via pageTitles.js in components and routeMetadata.mjs.
 * @type {Record<string, { title: string, description: string }>}
 */
export const PAGE_SEO_CATALOG = {
  '/': {
    title: STATIC_TITLES['/'](),
    description: DEFAULT_SITE_DESCRIPTION
  },
  '/market': {
    title: STATIC_TITLES['/market'](),
    description:
      'Live U.S. stock market dashboard with sector heatmap, index snapshots, stock charts, OHLC analytics, and trading signals for active traders.'
  },
  '/odin-signals': {
    title: STATIC_TITLES['/odin-signals'](),
    description:
      'Explore stock trading signals with an interactive treemap and filters to find bullish and bearish setups across U.S. equities.'
  },
  '/news': {
    title: STATIC_TITLES['/news'](),
    description:
      'Read market news and ticker-specific headlines for U.S. stocks and ETFs with quick symbol-level context for traders.'
  },
  '/heatmap': {
    title: STATIC_TITLES['/heatmap'](),
    description:
      'Interactive stock heatmap of U.S. equities by sector and industry with price change, market cap weighting, and drill-down ticker lists.'
  },
  '/market-movers': {
    title: STATIC_TITLES['/market-movers'](),
    description:
      'Track top gaining and losing stocks today with sortable market-movers tables and performance charts for U.S. equities.'
  },
  '/stock-splits': {
    title: STATIC_TITLES['/stock-splits'](),
    description:
      'Track recent U.S. stock splits and reverse splits with execution dates, ratios, and links to affected tickers.'
  },
  '/statistic-data': {
    title: STATIC_TITLES['/statistic-data'](),
    description:
      'Download stock statistics and returns across daily, weekly, monthly, quarterly, and annual horizons with OHLC-based analytics.'
  },
  '/return-table': {
    title: STATIC_TITLES['/return-table'](),
    description:
      'Compare multi-period returns for U.S. stocks, indices, sectors, and ETFs across 1D to long-term horizons in one return table.'
  },
  '/historical-data': {
    title: STATIC_TITLES['/historical-data'](),
    description:
      'Search ticker historical data and export OHLC price history for U.S. stocks and ETFs, including open, high, low, close, and date.'
  },
  '/historical-data/aapl': {
    title: historicalDataTitle('AAPL', 'Apple Inc.'),
    description:
      'Download and query historical OHLC stock price data for Apple Inc. (AAPL): daily, weekly, monthly, quarterly, and annual tables with CSV export.'
  },
  '/about': {
    title: STATIC_TITLES['/about'](),
    description: 'Manage your Odin500 account profile, plan, email, and security settings.'
  },
  '/premium': {
    title: STATIC_TITLES['/premium'](),
    description:
      'Compare Odin500 Basic, Premium, and Pro plans for index signals, ETF coverage, and full Odin trading signal access.'
  },
  '/relative-performance/ticker/aapl': {
    title: relativePerformanceTitle('AAPL'),
    description:
      'Compare ticker performance versus indices and sectors with excess return charts and period-by-period relative strength tables.'
  },
  '/indices/sp500': {
    title: indexPageTitle('S&P 500'),
    description:
      'Analyze S&P 500 index returns, signals, historical data, and constituent-level context for U.S. market research.'
  },
  '/indices/dow-jones': {
    title: indexPageTitle('Dow Jones'),
    description:
      'Track Dow Jones index returns, OHLC trends, and signal context with chart-ready analytics for traders and investors.'
  },
  '/indices/nasdaq-100': {
    title: indexPageTitle('Nasdaq 100'),
    description:
      'View Nasdaq 100 returns, trend signals, and historical index analytics with constituent-aware market context.'
  },
  '/ticker/aapl': {
    title: tickerPageTitle('AAPL', 'Apple Inc.'),
    description:
      'Apple Inc. (AAPL) stock price, OHLC chart, daily, weekly, monthly and annual returns, historical data, and trading signals.'
  },
  '/sector-data/xlk': {
    title: sectorPageTitle('Technology', 'XLK'),
    description:
      'Technology sector (XLK) ETF historical data, returns, heatmap context, and signal analytics for sector rotation research.'
  }
};

/**
 * @param {string} path
 * @returns {{ title: string, description: string }}
 */
export function seoForPath(path) {
  const key = path.replace(/\/+$/, '') || '/';
  return (
    PAGE_SEO_CATALOG[key] || {
      title: DEFAULT_SITE_TITLE,
      description: DEFAULT_SITE_DESCRIPTION
    }
  );
}
