/**
 * Post-build: copy dist/client/index.html into route folders with route-specific <title>,
 * meta description, canonical, and robots — helps crawlers that receive HTML per URL.
 * Requires the host to serve /path/index.html before SPA fallback.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { injectSeoIntoTemplate } from '../server/buildSeoHead.mjs';
import { resolveRequestMetadata } from '../server/routeMetadata.mjs';
import { PRERENDER_STATIC_PATHS } from '../src/seo/sitemapRoutes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const distDir = path.join(root, 'dist', 'client');
const indexFile = path.join(distDir, 'index.html');

function injectSeo(html, routePath) {
  const meta = resolveRequestMetadata(routePath);
  return injectSeoIntoTemplate(html, meta);
}

function writeRouteHtml(routePath, template) {
  const html = injectSeo(template, routePath);
  const segments = routePath.split('/').filter(Boolean);
  const dir = path.join(distDir, ...segments);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
}

function main() {
  if (!fs.existsSync(indexFile)) {
    console.warn('[prerender-meta] dist/client/index.html missing — run vite build first');
    process.exit(0);
  }
  const template = fs.readFileSync(indexFile, 'utf8');
  if (!template.includes('<!--SSR:TITLE-->')) {
    console.warn('[prerender-meta] dist/client/index.html has no SSR placeholders — skipping route shells');
    process.exit(0);
  }

  // Leave dist/client/index.html with placeholders for Express SSR at runtime.
  for (const route of PRERENDER_STATIC_PATHS) {
    writeRouteHtml(route, template);
  }
  console.log(`[prerender-meta] Wrote ${PRERENDER_STATIC_PATHS.length} HTML shells under dist/client/`);
}

main();
