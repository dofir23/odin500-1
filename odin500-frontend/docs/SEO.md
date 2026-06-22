# Odin500 frontend SEO

## Stack

- **React 18 + Vite 6** (client-side SPA + Express SSR in production)
- Head tags: `src/seo/usePageSeo.js` (runtime) + `server/routeMetadata.mjs` (SSR)
- Canonical origin: **`https://www.odin500.com`** (`src/seo/siteConfig.js`)

## Build

```bash
cp .env.example .env   # set VITE_AUTH_DISABLED=true for crawlable production builds
npm run sitemap        # writes sitemap index + tiered child sitemaps in public/
npm run build          # sitemap → vite build → prerender-meta shells → SSR bundle
npm start              # Express serves static + SSR HTML
```

## Sitemap tiers

`scripts/generate-sitemap.mjs` writes:

| File | Contents |
|------|----------|
| `sitemap.xml` | Sitemap index |
| `sitemap-core.xml` | Home, market tools, indices, sectors |
| `sitemap-tickers.xml` | `/ticker`, `/historical-data`, `/relative-performance`, `/ticker-report` per symbol |
| `sitemap-statistics.xml` | Five `/statistic/ticker-*` URLs per symbol (secondary priority) |

Submit **`https://www.odin500.com/sitemap.xml`** in Google Search Console.

## Auth and indexing

When **`VITE_AUTH_DISABLED=true`** is set at **build time**:

- `ProtectedRoute` does not redirect to `/login` for crawlers
- `canFetchProtectedApi()` is true without a user session

Production must be built with this flag. Runtime-only `.env` changes do not affect an existing `dist/`.

## Google Search Console verification

Set `VITE_GOOGLE_SITE_VERIFICATION` in `.env` before `npm run build`. Vite injects:

```html
<meta name="google-site-verification" content="..." />
```

## Internal linking

- `/browse` — HTML site map page
- `SeoSiteFooter` — popular tickers + core routes on every page
- `TickerSeoCrossLinks` — per-ticker links to chart, historical, stats, report
- Index constituent tables use crawlable `<Link>` to `/ticker/{sym}`

## Canonical URLs

Ticker paths use **lowercase** URL segments (`/ticker/aapl`). Uppercase paths redirect client-side.

## SSR content for crawlers

Express (`server/server.mjs`) renders React HTML into `#root` and enriches meta for:

- `/historical-data/:symbol` — OHLC preview table
- `/ticker/:symbol` — company name, latest close, recent OHLC rows

## Prerender shells

`scripts/prerender-meta.mjs` bakes title/description for a small set of static routes under `dist/client/`. HTML routes still use live SSR at runtime.

## Sitemap tickers

`generate-sitemap.mjs` loads symbols from `/api/tickers/groups` when the API is reachable at build time, else `SITEMAP_FALLBACK_TICKERS`, or `SITEMAP_TICKERS=AAPL,MSFT,...`.

## Post-deploy checklist

1. `curl -A Googlebot https://www.odin500.com/ticker/aapl` — unique title, content in `#root`
2. Resubmit `sitemap.xml` in Search Console
3. Request indexing for `/browse` and top index pages
4. Monitor “Crawled – currently not indexed” — focus on `sitemap-tickers.xml` URLs first
