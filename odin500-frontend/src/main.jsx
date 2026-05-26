import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppShell } from './appRouter.jsx';
import './index.css';
import { initAuthSessionOnLoad } from './store/apiStore.js';

initAuthSessionOnLoad();

const rootEl = document.getElementById('root');

ReactDOM.hydrateRoot(
  rootEl,
  <React.StrictMode>
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  </React.StrictMode>
);
