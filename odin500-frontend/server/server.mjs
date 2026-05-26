/**
 * Production Express server: static assets + SSR head/body injection for SEO.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import compression from 'compression';
import express from 'express';
import sirv from 'sirv';
import { injectAppIntoRoot, injectSeoIntoTemplate } from './buildSeoHead.mjs';
import { resolveRequestMetadata } from './routeMetadata.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const clientDir = path.join(root, 'dist', 'client');
const serverEntryFile = path.join(root, 'dist', 'server', 'entry-server.js');
const indexFile = path.join(clientDir, 'index.html');

if (!fs.existsSync(indexFile)) {
  console.error(`[server] Missing ${indexFile}. Run "npm run build" first.`);
  process.exit(1);
}

if (!fs.existsSync(serverEntryFile)) {
  console.error(`[server] Missing ${serverEntryFile}. Run "npm run build" first.`);
  process.exit(1);
}

const indexTemplate = fs.readFileSync(indexFile, 'utf8');
const app = express();
const port = Number(process.env.PORT) || 3000;

let renderApp;

async function getRenderApp() {
  if (!renderApp) {
    const mod = await import(pathToFileURL(serverEntryFile).href);
    if (typeof mod.render !== 'function') {
      throw new Error('dist/server/entry-server.js must export render(url)');
    }
    renderApp = mod.render;
  }
  return renderApp;
}

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

async function sendSsrHtml(req, res, next) {
  const accept = req.headers.accept || '';
  if (accept && !accept.includes('text/html') && !accept.includes('*/*')) {
    return next();
  }

  const requestUrl = req.originalUrl || req.url;
  const meta = resolveRequestMetadata(req.path);

  try {
    const render = await getRenderApp();
    const appHtml = await render(requestUrl);
    let html = injectSeoIntoTemplate(indexTemplate, meta);
    html = injectAppIntoRoot(html, appHtml);

    if (req.method === 'HEAD') {
      res.status(200).type('html').end();
      return;
    }
    res.status(200).type('html').send(html);
  } catch (err) {
    console.error(`[server] SSR render failed for ${req.path}:`, err);
    try {
      const html = injectSeoIntoTemplate(indexTemplate, meta);
      if (req.method === 'HEAD') {
        res.status(200).type('html').end();
        return;
      }
      res.status(200).type('html').send(html);
    } catch (fallbackErr) {
      next(fallbackErr);
    }
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

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`[server] Odin500 listening on http://0.0.0.0:${port}`);
  console.log(`[server] Serving static files from ${clientDir}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `[server] Port ${port} is already in use. Stop the other process or set PORT to a free port (e.g. PORT=3005 npm start).`
    );
  } else {
    console.error('[server] Failed to start:', err);
  }
  process.exit(1);
});
