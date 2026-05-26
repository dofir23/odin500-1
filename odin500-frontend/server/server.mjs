/**
 * Production Express server: static assets + per-request SSR head injection for SEO.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import compression from 'compression';
import express from 'express';
import sirv from 'sirv';
import { injectSeoIntoTemplate } from './buildSeoHead.mjs';
import { resolveRouteMetadata } from './routeMetadata.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const clientDir = path.join(root, 'dist', 'client');
const indexFile = path.join(clientDir, 'index.html');

if (!fs.existsSync(indexFile)) {
  console.error(`[server] Missing ${indexFile}. Run "npm run build" first.`);
  process.exit(1);
}

const indexTemplate = fs.readFileSync(indexFile, 'utf8');
const app = express();
const port = Number(process.env.PORT) || 3000;

app.disable('x-powered-by');
app.use(compression());

app.use(
  sirv(clientDir, {
    extensions: [],
    etag: true,
    gzip: false,
    brotli: false,
    setHeaders(res, pathname) {
      if (pathname.endsWith('/index.html') || pathname === 'index.html') {
        res.setHeader('Cache-Control', 'no-cache');
      }
    },
    onNoMatch: (req, res, next) => next()
  })
);

function sendSsrHtml(req, res, next) {
  const accept = req.headers.accept || '';
  if (accept && !accept.includes('text/html') && !accept.includes('*/*')) {
    return next();
  }

  try {
    const meta = resolveRouteMetadata(req.path);
    const html = injectSeoIntoTemplate(indexTemplate, meta);
    if (req.method === 'HEAD') {
      res.status(200).type('html').end();
      return;
    }
    res.status(200).type('html').send(html);
  } catch (err) {
    next(err);
  }
}

app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  sendSsrHtml(req, res, next);
});

app.use((err, req, res, _next) => {
  console.error('[server]', err);
  res.status(500).type('text/plain').send('Internal Server Error');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`[server] Odin500 listening on http://0.0.0.0:${port}`);
  console.log(`[server] Serving static files from ${clientDir}`);
});
