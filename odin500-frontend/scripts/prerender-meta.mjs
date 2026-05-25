/**
 * Post-build: copy dist/index.html into route folders with route-specific <title>,
 * meta description, canonical, and robots — helps crawlers that receive HTML per URL.
 * Requires the host to serve /path/index.html before SPA fallback.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PRERENDER_STATIC_PATHS } from '../src/seo/sitemapRoutes.js';
import { absoluteSiteUrl } from '../src/seo/sitemapRoutes.js';
import { seoForPath } from '../src/seo/pageSeoCatalog.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const distDir = path.join(root, 'dist');
const indexFile = path.join(distDir, 'index.html');

function injectSeo(html, { title, description, canonicalPath }) {
  const canonicalUrl = absoluteSiteUrl(canonicalPath);
  let out = html;
  out = out.replace(/<title>[^<]*<\/title>/i, `<title>${title}</title>`);
  if (/<meta\s+name="description"/i.test(out)) {
    out = out.replace(
      /<meta\s+name="description"[^>]*>/i,
      `<meta name="description" content="${description.replace(/"/g, '&quot;')}" />`
    );
  } else {
    out = out.replace(
      /<meta\s+name="viewport"[^>]*>/i,
      `$&\n    <meta name="description" content="${description.replace(/"/g, '&quot;')}" />`
    );
  }
  if (/<meta\s+name="robots"/i.test(out)) {
    out = out.replace(/<meta\s+name="robots"[^>]*>/i, `<meta name="robots" content="index,follow" />`);
  } else {
    out = out.replace(
      /<meta\s+name="description"[^>]*>/i,
      `$&\n    <meta name="robots" content="index,follow" />`
    );
  }
  if (/<link\s+rel="canonical"/i.test(out)) {
    out = out.replace(/<link\s+rel="canonical"[^>]*>/i, `<link rel="canonical" href="${canonicalUrl}" />`);
  } else {
    out = out.replace(/<\/head>/i, `    <link rel="canonical" href="${canonicalUrl}" />\n  </head>`);
  }
  return out;
}

function writeRouteHtml(routePath, template) {
  const { title, description } = seoForPath(routePath);
  const html = injectSeo(template, { title, description, canonicalPath: routePath });
  const segments = routePath.split('/').filter(Boolean);
  const dir = path.join(distDir, ...segments);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
}

function main() {
  if (!fs.existsSync(indexFile)) {
    console.warn('[prerender-meta] dist/index.html missing — run vite build first');
    process.exit(0);
  }
  const template = fs.readFileSync(indexFile, 'utf8');
  const rootSeo = seoForPath('/');
  fs.writeFileSync(indexFile, injectSeo(template, { ...rootSeo, canonicalPath: '/' }), 'utf8');

  for (const route of PRERENDER_STATIC_PATHS) {
    writeRouteHtml(route, template);
  }
  console.log(`[prerender-meta] Wrote ${PRERENDER_STATIC_PATHS.length + 1} HTML shells under dist/`);
}

main();
