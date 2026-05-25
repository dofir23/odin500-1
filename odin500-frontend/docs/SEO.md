# Odin500 frontend SEO

## Stack

- **React 18 + Vite 6** (client-side SPA, not Vue/Nuxt)
- Head tags: `src/seo/usePageSeo.js` (runtime `document.title`, meta, canonical)
- Canonical origin: **`https://www.odin500.com`** (`src/seo/siteConfig.js`)

## Build

```bash
npm run sitemap      # regenerate public/sitemap.xml
npm run build        # sitemap → vite build → prerender-meta shells in dist/
```

## Prerender (Task 5)

`scripts/prerender-meta.mjs` writes `dist/<route>/index.html` copies with baked title/description/canonical for static routes. Your host must serve those files before the SPA fallback (e.g. `try_files $uri $uri/ /index.html`).

Full SSR/SSG (e.g. Vite SSR, Remix, or prerender with Puppeteer) is not enabled yet — recommended next step if Google must see full chart HTML without login.

## Auth and indexing

When **`VITE_AUTH_DISABLED=true`** is set at **build time** (baked into the Vite bundle):

- `ProtectedRoute` does **not** redirect to `/login` — crawlers can open `/market`, `/ticker/aapl`, etc.
- `canFetchProtectedApi()` is true — pages can load market/ticker data without a user session.

Production must be built with this flag in the environment used for `npm run build` (setting it only in a runtime `.env` on the server without rebuilding does not change an already-built `dist/`).

If auth is enabled in a build (`VITE_AUTH_DISABLED` unset/false), Googlebot only sees `/login` for app routes.

Remaining indexing limits without full SSR: empty initial HTML shell (charts load after JS), and reliance on prerender meta shells + Google’s JavaScript rendering.

## Sitemap tickers

`scripts/generate-sitemap.mjs` loads symbols from `/api/tickers/groups` when the API is reachable at build time, else `SITEMAP_FALLBACK_TICKERS`, or `SITEMAP_TICKERS=AAPL,MSFT,...` env override.
