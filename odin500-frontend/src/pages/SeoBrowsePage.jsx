import { Link } from 'react-router-dom';
import { usePageSeo } from '../seo/usePageSeo.js';
import {
  SITEMAP_FALLBACK_TICKERS,
  SITEMAP_INDEX_SLUGS,
  SITEMAP_SECTOR_SLUGS,
  SITEMAP_STATIC_PATHS
} from '../seo/sitemapRoutes.js';
import { buildTickerHref } from '../utils/tickerUrlSync.js';

const STATIC_LABELS = {
  '/': 'Home',
  '/market': 'Market dashboard',
  '/odin-signals': 'Odin signals',
  '/news': 'News',
  '/heatmap': 'Heatmap',
  '/market-movers': 'Market movers',
  '/stock-splits': 'Stock splits',
  '/statistic-data': 'Statistic tables',
  '/return-table': 'Return table',
  '/about': 'Your profile',
  '/premium': 'Premium plans'
};

const INDEX_LABELS = {
  sp500: 'S&P 500',
  'dow-jones': 'Dow Jones',
  'nasdaq-100': 'Nasdaq 100'
};

const SECTOR_LABELS = {
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

export default function SeoBrowsePage() {
  usePageSeo({
    title: 'Site map — Odin500',
    description:
      'Browse Odin500 market dashboards, index analytics, sector ETFs, and ticker pages for U.S. equities.',
    canonicalPath: '/browse'
  });

  return (
    <div className="seo-browse-page odin-content-page">
      <header className="seo-browse-page__head">
        <h1 className="seo-browse-page__title">Site map</h1>
        <p className="seo-browse-page__lead">
          Crawlable links to core Odin500 pages, indices, sectors, and popular tickers.
        </p>
      </header>

      <section className="seo-browse-page__section" aria-labelledby="browse-core-h">
        <h2 id="browse-core-h">Core pages</h2>
        <ul className="seo-browse-page__list">
          {SITEMAP_STATIC_PATHS.map((p) => (
            <li key={p}>
              <Link to={p}>{STATIC_LABELS[p] || p}</Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="seo-browse-page__section" aria-labelledby="browse-indices-h">
        <h2 id="browse-indices-h">Indices</h2>
        <ul className="seo-browse-page__list">
          {SITEMAP_INDEX_SLUGS.map((slug) => (
            <li key={slug}>
              <Link to={`/indices/${slug}`}>{INDEX_LABELS[slug] || slug}</Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="seo-browse-page__section" aria-labelledby="browse-sectors-h">
        <h2 id="browse-sectors-h">Sectors</h2>
        <ul className="seo-browse-page__list seo-browse-page__list--cols">
          {SITEMAP_SECTOR_SLUGS.map((slug) => (
            <li key={slug}>
              <Link to={`/sector-data/${slug}`}>
                {SECTOR_LABELS[slug] || slug.toUpperCase()} ({slug.toUpperCase()})
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="seo-browse-page__section" aria-labelledby="browse-tickers-h">
        <h2 id="browse-tickers-h">Popular tickers</h2>
        <ul className="seo-browse-page__list seo-browse-page__list--cols">
          {SITEMAP_FALLBACK_TICKERS.map((sym) => (
            <li key={sym}>
              <Link to={buildTickerHref(sym)}>{sym}</Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
