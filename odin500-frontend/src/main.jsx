import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppShell } from './appRouter.jsx';
import './index.css';
import './styles/engagement.css';
import './styles/stock-splits.css';
import { initAuthSessionOnLoad } from './store/apiStore.js';

initAuthSessionOnLoad();

const rootEl = document.getElementById('root');
const app = (
  <React.StrictMode>
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  </React.StrictMode>
);

const hasSsrMarkup =
  rootEl &&
  (rootEl.childElementCount > 0 ||
    (rootEl.textContent && rootEl.textContent.trim().length > 0));

if (hasSsrMarkup) {
  ReactDOM.hydrateRoot(rootEl, app);
} else {
  ReactDOM.createRoot(rootEl).render(app);
}
