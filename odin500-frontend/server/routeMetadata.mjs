import {
  DEFAULT_SITE_DESCRIPTION,
  DEFAULT_SITE_TITLE,
  SEO_BRAND_NAME,
  SITE_ORIGIN
} from '../src/seo/siteConfig.js';
import {
  STATIC_TITLES,
  historicalDataTitle,
  indexPageTitle,
  relativePerformanceTitle,
  sectorPageTitle,
  statPeriodTitle,
  tickerPageTitle,
  tickerReportTitle
} from '../src/seo/pageTitles.js';
import { absoluteSiteUrl } from '../src/seo/sitemapRoutes.js';

const HOMEPAGE_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: SEO_BRAND_NAME,
  description:
    'OHLC data, ticker historical data, market heatmaps, index analytics, and trading signals for U.S. equities',
  url: SITE_ORIGIN,
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web'
};

function staticEntry(path, description, extra = {}) {
  return {
    title: STATIC_TITLES[path]?.() || DEFAULT_SITE_TITLE,
    description,
    canonical: `${SITE_ORIGIN}${path === '/' ? '/' : path}`,
    ...extra
  };
}

/** @type {Record<string, { title: string, description: string, canonical?: string, noindex?: boolean, jsonLd?: object }>} */
export const ROUTE_METADATA = {
  '/': staticEntry('/', DEFAULT_SITE_DESCRIPTION, { jsonLd: HOMEPAGE_JSON_LD }),
  '/market': staticEntry(
    '/market',
    'Live U.S. stock market dashboard with sector heatmap, index snapshots, stock charts, OHLC analytics, and trading signals for active traders.'
  ),
  '/odin-signals': staticEntry(
    '/odin-signals',
    'Explore stock trading signals with an interactive treemap and filters to find bullish and bearish setups across U.S. equities.'
  ),
  '/news': staticEntry(
    '/news',
    'Read market news and ticker-specific headlines for U.S. stocks and ETFs with quick symbol-level context for traders.'
  ),
  '/heatmap': staticEntry(
    '/heatmap',
    'Interactive stock heatmap of U.S. equities by sector and industry with price change, market cap weighting, and drill-down ticker lists.'
  ),
  '/market-movers': staticEntry(
    '/market-movers',
    'Track top gaining and losing stocks today with sortable market-movers tables and performance charts for U.S. equities.'
  ),
  '/statistic-data': staticEntry(
    '/statistic-data',
    'Download stock statistics and returns across daily, weekly, monthly, quarterly, and annual horizons with OHLC-based analytics.'
  ),
  '/return-table': staticEntry(
    '/return-table',
    'Compare multi-period returns for U.S. stocks, indices, sectors, and ETFs across 1D to long-term horizons in one return table.'
  ),
  '/stock-splits': staticEntry(
    '/stock-splits',
    'Track recent U.S. stock splits and reverse splits with execution dates, ratios, and links to affected tickers.'
  ),
  '/historical-data': staticEntry(
    '/historical-data',
    'Search ticker historical data and export OHLC price history for U.S. stocks and ETFs, including open, high, low, close, and date.'
  ),
  '/paper-trading': staticEntry(
    '/paper-trading',
    'Practice stock trading with a paper portfolio, simulated orders, positions, and strategy rules on Odin500.',
    { noindex: true }
  ),
  '/relative-performance/ticker/aapl': {
    title: relativePerformanceTitle('AAPL'),
    description:
      'Compare ticker performance versus indices and sectors with excess return charts and period-by-period relative strength tables.',
    canonical: `${SITE_ORIGIN}/relative-performance/ticker/aapl`
  },
  '/about': staticEntry(
    '/about',
    'Manage your Odin500 account profile, subscription plan, email preferences, and security settings from your personal dashboard.'
  ),
  '/premium': staticEntry(
    '/premium',
    'Compare Odin500 Basic, Premium, and Pro plans for index signals, ETF coverage, and full Odin trading-signal access across the platform.'
  ),
  '/accounts': staticEntry(
    '/accounts',
    'View and manage your Odin500 account details, billing preferences, and linked authentication settings in one secure place.',
    { noindex: true }
  ),
  '/indices/sp500': {
    title: indexPageTitle('S&P 500'),
    description:
      'Analyze S&P 500 index returns, signals, historical data, and constituent-level context for U.S. market research.',
    canonical: `${SITE_ORIGIN}/indices/sp500`
  },
  '/indices/dow-jones': {
    title: indexPageTitle('Dow Jones'),
    description:
      'Track Dow Jones index returns, OHLC trends, and signal context with chart-ready analytics for traders and investors.',
    canonical: `${SITE_ORIGIN}/indices/dow-jones`
  },
  '/indices/nasdaq-100': {
    title: indexPageTitle('Nasdaq 100'),
    description:
      'View Nasdaq 100 returns, trend signals, and historical index analytics with constituent-aware market context.',
    canonical: `${SITE_ORIGIN}/indices/nasdaq-100`
  },
  '/login': staticEntry(
    '/login',
    'Sign in to your Odin500 account to access market signals, charts, watchlists, and quant analytics.',
    { noindex: true }
  ),
  '/signup': staticEntry(
    '/signup',
    'Create a free Odin500 account to explore U.S. equity signals, market heatmaps, and ticker analytics.',
    { noindex: true }
  ),
  '/signup/verify-email': staticEntry(
    '/signup/verify-email',
    'Verify your email address to continue setting up your Odin500 account and unlock market analytics.',
    { noindex: true }
  ),
  '/signup/enter-code': staticEntry(
    '/signup/enter-code',
    'Enter the verification code sent to your email to complete Odin500 account registration.',
    { noindex: true }
  ),
  '/signup/username': staticEntry(
    '/signup/username',
    'Pick a username for your Odin500 profile before accessing signals, charts, and watchlist features.',
    { noindex: true }
  ),
  '/forgot-password': staticEntry(
    '/forgot-password',
    'Reset your Odin500 account password securely and regain access to market signals and analytics.',
    { noindex: true }
  ),
  '/auth/callback': staticEntry(
    '/auth/callback',
    'Completing sign-in to your Odin500 account. You will be redirected to the market dashboard shortly.',
    { noindex: true }
  )
};

export const INDEX_SLUG_LABELS = {
  sp500: 'S&P 500',
  'dow-jones': 'Dow Jones',
  'nasdaq-100': 'Nasdaq 100',
  nasdaq: 'Nasdaq 100'
};

export const SECTOR_SLUG_LABELS = {
  xlb: 'Materials',
  xlk: 'Technology',
  xlf: 'Financials',
  xlv: 'Healthcare',
  xli: 'Industrials',
  xle: 'Energy',
  xly: 'Consumer Discretionary',
  xlp: 'Consumer Staples',
  xlu: 'Utilities',
  xlre: 'Real Estate',
  xlc: 'Communication Services'
};

export const STAT_KIND_LABELS = {
  'ticker-annual': 'Annual',
  'ticker-quarterly': 'Quarterly',
  'ticker-monthly': 'Monthly',
  'ticker-weekly': 'Weekly',
  'ticker-daily': 'Daily'
};

/**
 * @param {string} pathname
 */
export function normalizePathname(pathname) {
  let path = String(pathname || '/').split('?')[0].split('#')[0] || '/';
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
  return path || '/';
}

/**
 * Dynamic route SEO — checked before static ROUTE_METADATA lookup.
 * @param {string} pathname
 * @returns {{ title: string, description: string, canonical: string, noindex?: boolean, jsonLd?: object } | null}
 */
export function resolveDynamicRouteMetadata(pathname) {
  const path = normalizePathname(pathname);

  const historicalDataMatch = path.match(/^\/historical-data\/([A-Za-z0-9.]+)$/i);
  if (historicalDataMatch) {
    const symbol = decodeURIComponent(historicalDataMatch[1]).toUpperCase();
    return {
      title: historicalDataTitle(symbol),
      description: `Download and query historical OHLC stock price data for ${symbol}: daily, weekly, monthly, quarterly, and annual open, high, low, close tables with CSV export.`,
      canonical: `${SITE_ORIGIN}/historical-data/${encodeURIComponent(symbol.toLowerCase())}`
    };
  }

  const tickerReportMatch = path.match(/^\/ticker-report\/([A-Za-z0-9.]+)$/i);
  if (tickerReportMatch) {
    const symbol = decodeURIComponent(tickerReportMatch[1]).toUpperCase();
    return {
      title: tickerReportTitle(symbol),
      description: `${symbol} monthly performance report with trailing returns, drawdown, relative strength, seasonality heatmap, and investor FAQs.`,
      canonical: `${SITE_ORIGIN}/ticker-report/${encodeURIComponent(symbol.toLowerCase())}`
    };
  }

  const tickerMatch = path.match(/^\/ticker\/([A-Za-z0-9.]+)$/i);
  if (tickerMatch) {
    const symbol = decodeURIComponent(tickerMatch[1]).toUpperCase();
    return {
      title: tickerPageTitle(symbol),
      description: `${symbol} stock price, OHLC chart, daily, weekly, monthly and annual returns, historical data, and trading signals for stock market research.`,
      canonical: `${SITE_ORIGIN}/ticker/${encodeURIComponent(symbol)}`
    };
  }

  const relPerfMatch = path.match(/^\/relative-performance\/ticker\/([A-Za-z0-9.,]+)$/i);
  if (relPerfMatch) {
    const raw = decodeURIComponent(relPerfMatch[1]);
    const primary = raw.split(',')[0].toUpperCase();
    return {
      title: relativePerformanceTitle(primary),
      description: `${primary} relative stock performance versus index benchmarks with excess return charts and period-by-period statistics.`,
      canonical: `${SITE_ORIGIN}/relative-performance/ticker/${encodeURIComponent(raw.toLowerCase())}`
    };
  }

  const indexMatch = path.match(/^\/indices\/([a-z0-9-]+)$/i);
  if (indexMatch) {
    const slug = decodeURIComponent(indexMatch[1]).toLowerCase();
    const label = INDEX_SLUG_LABELS[slug] || slug.replace(/-/g, ' ');
    return {
      title: indexPageTitle(label),
      description: `${label} index historical data, OHLC chart trends, returns, and signal analytics for traders and investors.`,
      canonical: `${SITE_ORIGIN}/indices/${encodeURIComponent(slug)}`
    };
  }

  const sectorMatch = path.match(/^\/sector-data\/([a-z0-9]+)$/i);
  if (sectorMatch) {
    const slug = decodeURIComponent(sectorMatch[1]).toLowerCase();
    const label = SECTOR_SLUG_LABELS[slug] || slug.toUpperCase();
    return {
      title: sectorPageTitle(label, slug),
      description: `${label} sector ETF historical data, returns, heatmap context, and signal analytics for sector rotation research.`,
      canonical: `${SITE_ORIGIN}/sector-data/${encodeURIComponent(slug)}`
    };
  }

  const statMatch = path.match(/^\/statistic\/(ticker-(?:annual|quarterly|monthly|weekly|daily))\/([A-Za-z0-9.]+)$/i);
  if (statMatch) {
    const kind = statMatch[1].toLowerCase();
    const symbol = decodeURIComponent(statMatch[2]).toUpperCase();
    const horizon = STAT_KIND_LABELS[kind] || 'Periodic';
    return {
      title: statPeriodTitle(symbol, horizon),
      description: `${symbol} ${horizon.toLowerCase()} stock returns, price history, OHLC statistics and return tables for U.S. equity research.`,
      canonical: `${SITE_ORIGIN}/statistic/${kind}/${encodeURIComponent(symbol)}`
    };
  }

  return null;
}

/**
 * Enrich historical-data meta with company name, date range, and latest close when preview is available.
 * @param {{ title: string, description: string, canonical: string, noindex?: boolean, jsonLd?: object }} meta
 * @param {{ symbol?: string, company_name?: string | null, min_date?: string, max_date?: string, latest_date?: string, latest_close?: number | null }} preview
 */
export function enrichHistoricalDataMetadata(meta, preview) {
  if (!preview?.symbol) return meta;

  const sym = String(preview.symbol).toUpperCase();
  const name = String(preview.company_name || '').trim();
  const label = name ? `${name} (${sym})` : sym;

  const rangeBit =
    preview.min_date && preview.max_date
      ? ` Daily OHLC from ${preview.min_date} through ${preview.max_date}.`
      : '';

  let closeBit = '';
  if (preview.latest_close != null && preview.latest_date) {
    const close = Number(preview.latest_close);
    const closeStr = Number.isFinite(close) ? close.toFixed(2) : String(preview.latest_close);
    closeBit = ` Latest close $${closeStr} on ${preview.latest_date}.`;
  }

  return {
    ...meta,
    title: historicalDataTitle(sym, name),
    description: `${label} historical OHLC stock price preview, date-range tables, and CSV export.${rangeBit}${closeBit} View ${sym} charts and signals on Odin500.`
  };
}

/**
 * @param {string} pathname
 * @returns {{ title: string, description: string, canonical: string, noindex?: boolean, jsonLd?: object }}
 */
export function resolveRequestMetadata(pathname) {
  const path = normalizePathname(pathname);
  return (
    resolveDynamicRouteMetadata(path) ||
    resolveStaticRouteMetadata(path) || {
      title: DEFAULT_SITE_TITLE,
      description: DEFAULT_SITE_DESCRIPTION,
      canonical: absoluteSiteUrl(path)
    }
  );
}

/**
 * Static routes only.
 * @param {string} pathname
 * @returns {{ title: string, description: string, canonical: string, noindex?: boolean, jsonLd?: object } | null}
 */
export function resolveStaticRouteMetadata(pathname) {
  const path = normalizePathname(pathname);
  const staticMeta = ROUTE_METADATA[path];

  if (!staticMeta) return null;

  return {
    title: staticMeta.title,
    description: staticMeta.description,
    canonical: staticMeta.canonical || absoluteSiteUrl(path),
    noindex: staticMeta.noindex,
    jsonLd: staticMeta.jsonLd
  };
}

/** @deprecated Use resolveRequestMetadata — dynamic routes are resolved first. */
export function resolveRouteMetadata(pathname) {
  return resolveRequestMetadata(pathname);
}
