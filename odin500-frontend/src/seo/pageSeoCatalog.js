import { DEFAULT_SITE_DESCRIPTION, DEFAULT_SITE_TITLE } from './siteConfig.js';

/**
 * Static SEO copy for prerender shells and documentation.
 * Dynamic pages (ticker, index) set titles in their components via usePageSeo.
 * @type {Record<string, { title: string, description: string }>}
 */
export const PAGE_SEO_CATALOG = {
  '/': {
    title: DEFAULT_SITE_TITLE,
    description: DEFAULT_SITE_DESCRIPTION
  },
  '/market': {
    title: 'Odin500 Market Dashboard | Live Signals, Heatmap & Index Snapshots',
    description:
      'U.S. market dashboard with Odin500 quant signals, performance charts, sector and index snapshots, and daily equity analytics.'
  },
  '/odin-signals': {
    title: 'Odin Signals Treemap | Odin500 Quant Signal Explorer',
    description:
      'Explore Odin500 trading signals across the market with an interactive treemap, filters, and signal strength visualization.'
  },
  '/news': {
    title: 'Market News Center | Odin500',
    description: 'Curated market and ticker-specific news with Odin500 context for U.S. equities and ETFs.'
  },
  '/heatmap': {
    title: 'Market Heatmap | Sector & Industry Performance | Odin500',
    description:
      'Visual heatmap of U.S. stocks by sector and industry with price change, market cap, and drill-down ticker lists.'
  },
  '/market-movers': {
    title: 'Market Movers | Top Gainers & Losers | Odin500',
    description: 'Track top gaining and losing U.S. stocks with Odin500 market mover tables and charts.'
  },
  '/statistic-data': {
    title: 'Statistic Data Tables | Returns & OHLC Analytics | Odin500',
    description:
      'Downloadable return statistics across daily, weekly, monthly, quarterly, and annual horizons for Odin500-covered tickers.'
  },
  '/return-table': {
    title: 'Return Table — Index, Sector & ETF Period Returns | Odin500',
    description:
      'Multi-period return tables for US indices, S&P 500 sectors, index ETFs, and other market series across 1D through 20Y horizons.'
  },
  '/historical-data': {
    title: 'Historical OHLC Data Export | Odin500',
    description: 'Query and export historical open-high-low-close price data and signals for U.S. equities on Odin500.'
  },
  '/about': {
    title: 'Your Odin500 Profile & Account Settings',
    description: 'Manage your Odin500 account profile, plan, email, and security settings.'
  },
  '/premium': {
    title: 'Odin500 Premium Plans | Pro Quant Signals & Market Data',
    description:
      'Compare Odin500 Basic, Premium, and Pro plans for index signals, ETF coverage, and full Odin trading signal access.'
  },
  '/relative-performance/ticker/aapl': {
    title: 'Relative Performance Comparison | Odin500',
    description:
      'Compare relative performance and excess returns across tickers, indices, and sectors with Odin500 charts and tables.'
  },
  '/indices/sp500': {
    title: 'S&P 500 Index Analytics | Odin500',
    description: 'S&P 500 index returns, constituents, charts, and Odin500 signal context.'
  },
  '/indices/dow-jones': {
    title: 'Dow Jones Index Analytics | Odin500',
    description: 'Dow Jones index returns, constituents, charts, and Odin500 market statistics.'
  },
  '/indices/nasdaq-100': {
    title: 'Nasdaq 100 Index Analytics | Odin500',
    description: 'Nasdaq-100 index returns, constituents, charts, and Odin500 analytics.'
  },
  '/ticker/aapl': {
    title: 'AAPL Stock Signals, Returns & Market Statistics | Odin500',
    description:
      'Apple (AAPL) Odin500 signals, annual and periodic returns, OHLC charts, and strategy comparison on Odin500.'
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
