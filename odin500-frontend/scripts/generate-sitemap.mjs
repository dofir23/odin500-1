/**
 * Build-time sitemap generator. Run: node scripts/generate-sitemap.mjs
 * Writes sitemap index + tiered child sitemaps under public/.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE_ORIGIN } from '../src/seo/siteConfig.js';
import {
  SITEMAP_FALLBACK_TICKERS,
  buildSitemapCorePaths,
  buildSitemapStatisticPaths,
  buildSitemapTickerPaths
} from '../src/seo/sitemapRoutes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const publicDir = path.join(root, 'public');

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function fetchTickersFromApi() {
  const apiBase = (
    process.env.SITEMAP_API_ORIGIN ||
    process.env.VITE_API_ORIGIN_PROD ||
    'https://odin500-1-production.up.railway.app'
  ).replace(/\/$/, '');

  const res = await fetch(`${apiBase}/api/tickers/groups`, {
    headers: { Accept: 'application/json' }
  });
  if (!res.ok) throw new Error(`tickers/groups ${res.status}`);
  const groups = await res.json();
  if (!Array.isArray(groups)) throw new Error('invalid groups payload');

  const symbols = [];
  for (const g of groups.slice(0, 12)) {
    const code = String(g.code || '').trim();
    if (!code) continue;
    try {
      const r = await fetch(`${apiBase}/api/tickers/group/${encodeURIComponent(code)}`, {
        headers: { Accept: 'application/json' }
      });
      if (!r.ok) continue;
      const p = await r.json();
      const list = Array.isArray(p.tickers) ? p.tickers : [];
      for (const t of list) {
        const sym = String(t.symbol || '').trim().toUpperCase();
        if (sym) symbols.push(sym);
      }
    } catch {
      /* skip group */
    }
  }
  return [...new Set(symbols)].sort();
}

async function resolveTickers() {
  const envList = String(process.env.SITEMAP_TICKERS || '')
    .split(/[,\s]+/)
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
  if (envList.length) return envList;

  try {
    const fromApi = await fetchTickersFromApi();
    if (fromApi.length) {
      console.log(`[sitemap] ${fromApi.length} tickers from API`);
      return fromApi.slice(0, 559);
    }
  } catch (err) {
    console.warn('[sitemap] API ticker fetch failed, using fallback list:', err.message);
  }
  return SITEMAP_FALLBACK_TICKERS;
}

function toLoc(pathname) {
  if (pathname === '/') return `${SITE_ORIGIN}/`;
  return `${SITE_ORIGIN}${pathname}`;
}

function writeUrlset(filename, paths, lastmod) {
  const urls = paths
    .map((p) => {
      return `  <url>\n    <loc>${escapeXml(toLoc(p))}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`;
    })
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  const out = path.join(publicDir, filename);
  fs.writeFileSync(out, xml, 'utf8');
  return paths.length;
}

function writeSitemapIndex(files, lastmod) {
  const entries = files
    .map(
      (f) =>
        `  <sitemap>\n    <loc>${escapeXml(`${SITE_ORIGIN}/${f}`)}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </sitemap>`
    )
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</sitemapindex>\n`;
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml, 'utf8');
}

async function main() {
  const tickers = await resolveTickers();
  const today = new Date().toISOString().slice(0, 10);

  const corePaths = buildSitemapCorePaths();
  const tickerPaths = buildSitemapTickerPaths(tickers);
  const statPaths = buildSitemapStatisticPaths(tickers);

  fs.mkdirSync(publicDir, { recursive: true });

  const coreCount = writeUrlset('sitemap-core.xml', corePaths, today);
  const tickerCount = writeUrlset('sitemap-tickers.xml', tickerPaths, today);
  const statCount = writeUrlset('sitemap-statistics.xml', statPaths, today);

  writeSitemapIndex(['sitemap-core.xml', 'sitemap-tickers.xml', 'sitemap-statistics.xml'], today);

  const total = coreCount + tickerCount + statCount;
  console.log(
    `[sitemap] Wrote index + ${total} URLs (core=${coreCount}, tickers=${tickerCount}, statistics=${statCount})`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
