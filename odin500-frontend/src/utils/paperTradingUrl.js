import { sanitizeTickerPageInput } from './tickerUrlSync.js';

const VALID_TABS = new Set(['positions', 'orders', 'closed', 'insights', 'strategy']);

/**
 * @param {{ ticker?: string, tab?: string }} [options]
 * @returns {string}
 */
export function buildPaperTradingUrl({ ticker, tab } = {}) {
  const params = new URLSearchParams();
  const sym = sanitizeTickerPageInput(ticker);
  if (sym) params.set('ticker', sym);
  if (tab && VALID_TABS.has(tab)) params.set('tab', tab);
  const qs = params.toString();
  return qs ? `/paper-trading?${qs}` : '/paper-trading';
}

/**
 * @param {string} [search]
 * @returns {{ ticker: string, tab: string }}
 */
export function readPaperTradingSearchParams(search = '') {
  let params;
  try {
    params = new URLSearchParams(search || (typeof window !== 'undefined' ? window.location.search : ''));
  } catch {
    params = new URLSearchParams();
  }
  const rawTicker = params.get('ticker') || params.get('symbol') || '';
  const ticker = sanitizeTickerPageInput(rawTicker) || '';
  const rawTab = params.get('tab') || 'positions';
  const tab = VALID_TABS.has(rawTab) ? rawTab : 'positions';
  return { ticker, tab };
}
