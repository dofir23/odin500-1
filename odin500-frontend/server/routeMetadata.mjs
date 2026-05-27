import { DEFAULT_SITE_DESCRIPTION, DEFAULT_SITE_TITLE, SITE_ORIGIN } from '../src/seo/siteConfig.js';
import { absoluteSiteUrl } from '../src/seo/sitemapRoutes.js';

const HOMEPAGE_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Odin500',
  description:
    'U.S. equity market signals, heatmaps, index analytics and OHLC data for traders and investors',
  url: SITE_ORIGIN,
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web'
};

/** @type {Record<string, { title: string, description: string, canonical?: string, noindex?: boolean, jsonLd?: object }>} */
export const ROUTE_METADATA = {
  '/': {
    title: 'Odin500 | Quant Market Signals, Charts & Statistics',
    description:
      'Odin500 delivers U.S. equity market signals, heatmaps, index and sector analytics, ticker statistics, and historical OHLC data for traders and investors.',
    canonical: `${SITE_ORIGIN}/`,
    jsonLd: HOMEPAGE_JSON_LD
  },
  '/market': {
    title: 'Market Overview | Odin500',
    description:
      'Live U.S. equity market overview with Odin500 signals, performance heatmaps, sector snapshots, and index analytics updated for active traders.',
    canonical: `${SITE_ORIGIN}/market`
  },
  '/odin-signals': {
    title: 'Odin Signals Treemap | Odin500',
    description:
      'Explore Odin500 quant trading signals across the U.S. market with an interactive treemap, filters, and signal-strength visualization.',
    canonical: `${SITE_ORIGIN}/odin-signals`
  },
  '/news': {
    title: 'Market News Center | Odin500',
    description:
      'Curated U.S. equity market and ticker-specific news with Odin500 context—headlines, symbols, and links for stocks and ETFs you follow.',
    canonical: `${SITE_ORIGIN}/news`
  },
  '/heatmap': {
    title: 'Market Heatmap | Odin500',
    description:
      'Interactive U.S. stock heatmap by sector and industry with price change, market cap sizing, and drill-down lists for movers and laggards.',
    canonical: `${SITE_ORIGIN}/heatmap`
  },
  '/market-movers': {
    title: 'Market Movers | Odin500',
    description:
      'Track top gaining and losing U.S. stocks with Odin500 market-mover tables, bar charts, and daily performance rankings across the market.',
    canonical: `${SITE_ORIGIN}/market-movers`
  },
  '/statistic-data': {
    title: 'Statistic Data Tables | Odin500',
    description:
      'Downloadable return statistics across daily, weekly, monthly, quarterly, and annual horizons for Odin500-covered U.S. equities and ETFs.',
    canonical: `${SITE_ORIGIN}/statistic-data`
  },
  '/historical-data': {
    title: 'Historical OHLC Data Export | Odin500',
    description:
      'Query and export historical open-high-low-close prices and related signals for U.S. equities and ETFs covered on Odin500.',
    canonical: `${SITE_ORIGIN}/historical-data`
  },
  '/relative-performance/ticker/aapl': {
    title: 'Relative Performance Comparison | Odin500',
    description:
      'Compare relative performance and excess returns across tickers, indices, and sectors with Odin500 charts, tables, and benchmark overlays.',
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
    title: 'S&P 500 Index Analytics & Signals | Odin500',
    description:
      'S&P 500 index signals, heatmaps, OHLC charts, and sector analytics updated in real time on Odin500 for traders and investors.',
    canonical: `${SITE_ORIGIN}/indices/sp500`
  },
  '/indices/dow-jones': {
    title: 'Dow Jones Index Analytics & Signals | Odin500',
    description:
      'Dow Jones Industrial Average index signals, OHLC charts, sector breakdown, and historical analytics for traders on Odin500.',
    canonical: `${SITE_ORIGIN}/indices/dow-jones`
  },
  '/indices/nasdaq-100': {
    title: 'Nasdaq 100 Index Analytics & Signals | Odin500',
    description:
      'Nasdaq-100 index signals, constituent charts, sector breakdown, and historical OHLC data for quant traders on Odin500.',
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
      title: `${symbol} Stock Signals & Charts | Odin500`,
      description: `${symbol} ticker statistics, OHLC charts, quant signals and historical data for traders and investors on Odin500.`,
      canonical: `${SITE_ORIGIN}/ticker/${encodeURIComponent(symbol)}`
    };
  }

  const indexMatch = path.match(/^\/indices\/([a-z0-9-]+)$/i);
  if (indexMatch) {
    const slug = decodeURIComponent(indexMatch[1]).toLowerCase();
    const label = INDEX_SLUG_LABELS[slug] || slug.replace(/-/g, ' ');
    return {
      title: `${label} Index Analytics & Signals | Odin500`,
      description: `${label} index signals, constituent returns, OHLC charts, and sector analytics on Odin500 for traders and investors.`,
      canonical: `${SITE_ORIGIN}/indices/${encodeURIComponent(slug)}`
    };
  }

  const sectorMatch = path.match(/^\/sector-data\/([a-z0-9]+)$/i);
  if (sectorMatch) {
    const slug = decodeURIComponent(sectorMatch[1]).toLowerCase();
    const label = SECTOR_SLUG_LABELS[slug] || slug.toUpperCase();
    return {
      title: `${label} Sector ETF Analytics | Odin500`,
      description: `${label} sector ETF signals, S&P 500 sector returns, heatmaps, and constituent analytics on Odin500 for sector rotation research.`,
      canonical: `${SITE_ORIGIN}/sector-data/${encodeURIComponent(slug)}`
    };
  }

  const statMatch = path.match(/^\/statistic\/(ticker-(?:annual|quarterly|monthly|weekly|daily))\/([A-Za-z0-9.]+)$/i);
  if (statMatch) {
    const kind = statMatch[1].toLowerCase();
    const symbol = decodeURIComponent(statMatch[2]).toUpperCase();
    const horizon = STAT_KIND_LABELS[kind] || 'Periodic';
    return {
      title: `${symbol} ${horizon} Returns Statistics | Odin500`,
      description: `${symbol} ${horizon.toLowerCase()} return statistics, bar charts, and downloadable tables on Odin500 for U.S. equity performance research.`,
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
