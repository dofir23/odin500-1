import {
  DEFAULT_SITE_DESCRIPTION,
  DEFAULT_SITE_TITLE,
  SEO_BRAND_NAME,
  SITE_ORIGIN
} from '../src/seo/siteConfig.js';
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

/** @type {Record<string, { title: string, description: string, canonical?: string, noindex?: boolean, jsonLd?: object }>} */
export const ROUTE_METADATA = {
  '/': {
    title: DEFAULT_SITE_TITLE,
    description: DEFAULT_SITE_DESCRIPTION,
    canonical: `${SITE_ORIGIN}/`,
    jsonLd: HOMEPAGE_JSON_LD
  },
  '/market': {
    title: 'Stock Market Dashboard, Heatmap & Trading Signals | Odin500',
    description:
      'Live U.S. stock market dashboard with sector heatmap, index snapshots, OHLC analytics, and trading signals for active traders.',
    canonical: `${SITE_ORIGIN}/market`
  },
  '/odin-signals': {
    title: 'Stock Signal Screener Treemap | Trading Signals | Odin500',
    description:
      'Explore stock trading signals with an interactive treemap and filters to find bullish and bearish setups across U.S. equities.',
    canonical: `${SITE_ORIGIN}/odin-signals`
  },
  '/news': {
    title: 'Stock Market News by Ticker | Odin500',
    description:
      'Read market news and ticker-specific headlines for U.S. stocks and ETFs with quick symbol-level context for traders.',
    canonical: `${SITE_ORIGIN}/news`
  },
  '/heatmap': {
    title: 'Stock Heatmap | Sector & Industry Performance | Odin500',
    description:
      'Interactive stock heatmap of U.S. equities by sector and industry with price change, market cap weighting, and drill-down ticker lists.',
    canonical: `${SITE_ORIGIN}/heatmap`
  },
  '/market-movers': {
    title: 'Top Gainers and Losers Today | Market Movers | Odin500',
    description:
      'Track top gaining and losing stocks today with sortable market-movers tables and performance charts for U.S. equities.',
    canonical: `${SITE_ORIGIN}/market-movers`
  },
  '/statistic-data': {
    title: 'Stock Statistics Tables | Returns & OHLC Analytics | Odin500',
    description:
      'Download stock statistics and returns across daily, weekly, monthly, quarterly, and annual horizons with OHLC-based analytics.',
    canonical: `${SITE_ORIGIN}/statistic-data`
  },
  '/historical-data': {
    title: 'OHLC Historical Data Download for Stocks | Odin500',
    description:
      'Search ticker historical data and export OHLC price history for U.S. stocks and ETFs, including open, high, low, close, and date.',
    canonical: `${SITE_ORIGIN}/historical-data`
  },
  '/relative-performance/ticker/aapl': {
    title: 'Ticker Relative Performance vs Index | Odin500',
    description:
      'Compare ticker performance versus indices and sectors with excess return charts and period-by-period relative strength tables.',
    canonical: `${SITE_ORIGIN}/relative-performance/ticker/aapl`
  },
  '/about': {
    title: 'Your Odin500 Profile & Account Settings',
    description:
      'Manage your Odin500 account profile, subscription plan, email preferences, and security settings from your personal dashboard.',
    canonical: `${SITE_ORIGIN}/about`
  },
  '/premium': {
    title: 'Odin500 Premium Plans | Odin500',
    description:
      'Compare Odin500 Basic, Premium, and Pro plans for index signals, ETF coverage, and full Odin trading-signal access across the platform.',
    canonical: `${SITE_ORIGIN}/premium`
  },
  '/accounts': {
    title: 'Account Management | Odin500',
    description:
      'View and manage your Odin500 account details, billing preferences, and linked authentication settings in one secure place.',
    canonical: `${SITE_ORIGIN}/accounts`
  },
  '/indices/sp500': {
    title: 'S&P 500 Index Data, Returns & Signals | Odin500',
    description:
      'Analyze S&P 500 index returns, signals, historical data, and constituent-level context for U.S. market research.',
    canonical: `${SITE_ORIGIN}/indices/sp500`
  },
  '/indices/dow-jones': {
    title: 'Dow Jones Index Data, Returns & Signals | Odin500',
    description:
      'Track Dow Jones index returns, OHLC trends, and signal context with chart-ready analytics for traders and investors.',
    canonical: `${SITE_ORIGIN}/indices/dow-jones`
  },
  '/indices/nasdaq-100': {
    title: 'Nasdaq 100 Index Data, Returns & Signals | Odin500',
    description:
      'View Nasdaq 100 returns, trend signals, and historical index analytics with constituent-aware market context.',
    canonical: `${SITE_ORIGIN}/indices/nasdaq-100`
  },
  '/login': {
    title: 'Sign In | Odin500',
    description: 'Sign in to your Odin500 account to access market signals, charts, watchlists, and quant analytics.',
    canonical: `${SITE_ORIGIN}/login`,
    noindex: true
  },
  '/signup': {
    title: 'Create Account | Odin500',
    description: 'Create a free Odin500 account to explore U.S. equity signals, market heatmaps, and ticker analytics.',
    canonical: `${SITE_ORIGIN}/signup`,
    noindex: true
  },
  '/signup/verify-email': {
    title: 'Verify Email | Odin500',
    description: 'Verify your email address to continue setting up your Odin500 account and unlock market analytics.',
    canonical: `${SITE_ORIGIN}/signup/verify-email`,
    noindex: true
  },
  '/signup/enter-code': {
    title: 'Enter Verification Code | Odin500',
    description: 'Enter the verification code sent to your email to complete Odin500 account registration.',
    canonical: `${SITE_ORIGIN}/signup/enter-code`,
    noindex: true
  },
  '/signup/username': {
    title: 'Choose Username | Odin500',
    description: 'Pick a username for your Odin500 profile before accessing signals, charts, and watchlist features.',
    canonical: `${SITE_ORIGIN}/signup/username`,
    noindex: true
  },
  '/forgot-password': {
    title: 'Reset Password | Odin500',
    description: 'Reset your Odin500 account password securely and regain access to market signals and analytics.',
    canonical: `${SITE_ORIGIN}/forgot-password`,
    noindex: true
  },
  '/auth/callback': {
    title: 'Signing In | Odin500',
    description: 'Completing sign-in to your Odin500 account. You will be redirected to the market dashboard shortly.',
    canonical: `${SITE_ORIGIN}/auth/callback`,
    noindex: true
  }
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

  const tickerMatch = path.match(/^\/ticker\/([A-Za-z0-9.]+)$/i);
  if (tickerMatch) {
    const symbol = decodeURIComponent(tickerMatch[1]).toUpperCase();
    return {
      title: `${symbol} Historical Data, OHLC Chart & Trading Signals | Odin500`,
      description: `${symbol} ticker historical data, OHLC price chart trends, returns, and trading signals for stock market research.`,
      canonical: `${SITE_ORIGIN}/ticker/${encodeURIComponent(symbol)}`
    };
  }

  const indexMatch = path.match(/^\/indices\/([a-z0-9-]+)$/i);
  if (indexMatch) {
    const slug = decodeURIComponent(indexMatch[1]).toLowerCase();
    const label = INDEX_SLUG_LABELS[slug] || slug.replace(/-/g, ' ');
    return {
      title: `${label} Index Data, Returns & OHLC Signals | Odin500`,
      description: `${label} index historical data, OHLC chart trends, returns, and signal analytics for traders and investors.`,
      canonical: `${SITE_ORIGIN}/indices/${encodeURIComponent(slug)}`
    };
  }

  const sectorMatch = path.match(/^\/sector-data\/([a-z0-9]+)$/i);
  if (sectorMatch) {
    const slug = decodeURIComponent(sectorMatch[1]).toLowerCase();
    const label = SECTOR_SLUG_LABELS[slug] || slug.toUpperCase();
    return {
      title: `${label} Sector ETF Data, Returns & Signals | Odin500`,
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
      title: `${symbol} ${horizon} Return Statistics & Historical Data | Odin500`,
      description: `${symbol} ${horizon.toLowerCase()} return statistics, historical performance tables, and OHLC-based analytics for U.S. equity research.`,
      canonical: `${SITE_ORIGIN}/statistic/${kind}/${encodeURIComponent(symbol)}`
    };
  }

  return null;
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
