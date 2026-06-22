/** Lowercase URL segment for ticker-like routes (canonical paths). */
export function tickerPathSegment(symbol) {
  return String(symbol || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '')
    .slice(0, 20);
}
