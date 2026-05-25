/**
 * Build-time sitemap generator. Run: node scripts/generate-sitemap.mjs
 * Writes public/sitemap.xml (valid XML, no script tags).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE_ORIGIN } from '../src/seo/siteConfig.js';
import { SITEMAP_FALLBACK_TICKERS, buildDynamicSitemapPaths } from '../src/seo/sitemapRoutes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outFile = path.join(root, 'public', 'sitemap.xml');

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
      return fromApi.slice(0, 500);
    }
  } catch (err) {
    console.warn('[sitemap] API ticker fetch failed, using fallback list:', err.message);
  }
  return SITEMAP_FALLBACK_TICKERS;
}

function toLoc(path) {
  if (path === '/') return `${SITE_ORIGIN}/`;
  return `${SITE_ORIGIN}${path}`;
}

async function main() {
  const tickers = await resolveTickers();
  const paths = buildDynamicSitemapPaths(tickers);
  const today = new Date().toISOString().slice(0, 10);

  const urls = paths
    .map((p) => {
      return `  <url>\n    <loc>${escapeXml(toLoc(p))}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, xml, 'utf8');
  console.log(`[sitemap] Wrote ${paths.length} URLs to ${outFile}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
