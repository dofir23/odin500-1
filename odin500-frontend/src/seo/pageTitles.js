/**
 * Keyword-first SEO titles: search terms before brand, use "and" not "&".
 * /market is the only route that leads with Odin500 (and ends with it).
 */

export const BRAND = 'Odin500';

/**
 * @param {string} body Primary keywords (no brand).
 * @param {{ leadBrand?: boolean }} [opts]
 */
export function withBrand(body, { leadBrand = false } = {}) {
  const text = String(body || '').trim();
  if (leadBrand) return `Odin500 ${text} | ${BRAND}`;
  return `${text} | ${BRAND}`;
}

/**
 * @param {string} symbol
 * @param {string} [companyName]
 */
export function tickerHeadline(symbol, companyName) {
  const sym = String(symbol || '')
    .toUpperCase()
    .trim();
  const name = String(companyName || '').trim();
  if (name) return `${name} (${sym})`;
  return sym;
}

/** @type {Record<string, () => string>} */
export const STATIC_TITLES = {
  '/': () => withBrand('OHLC Data, Stock Charts, Historical Prices and Trading Signals'),
  '/market': () =>
    withBrand(
      'Live U.S. Stock Market Dashboard, Heatmap, Stock Charts, OHLC Data and Trading Signals',
      { leadBrand: true }
    ),
  '/odin-signals': () =>
    withBrand('Stock Trading Signals Screener, Treemap, Quant Dashboard and Daily Signals'),
  '/heatmap': () => withBrand('Stock Market Heatmap by Sector, Industry and Index Performance'),
  '/market-movers': () =>
    withBrand('Top Stock Gainers and Losers Today, Market Movers and Price Change'),
  '/news': () => withBrand('Stock Market News, Index News and Ticker Headlines'),
  '/statistic-data': () =>
    withBrand(
      'Stock Statistics Tables, Daily, Weekly, Monthly, Quarterly and Annual Returns and OHLC Data'
    ),
  '/return-table': () =>
    withBrand('Stock, Index, Sector and ETF Return Table, Multi-Period Performance'),
  '/stock-splits': () =>
    withBrand('Recent Stock Splits, Reverse Splits and Corporate Actions Tracker'),
  '/historical-data': () =>
    withBrand('Download Stock OHLC Historical Data, Historical Prices and CSV Export'),
  '/premium': () => withBrand('Premium Plans, Pro Quant Signals and Market Data Pricing'),
  '/about': () => withBrand('Account Profile and Settings'),
  '/accounts': () => withBrand('Account Management'),
  '/paper-trading': () => withBrand('Paper Trading Simulator, Practice Portfolio and Orders'),
  '/login': () => withBrand('Sign In'),
  '/signup': () => withBrand('Create Account'),
  '/signup/verify-email': () => withBrand('Verify Email'),
  '/signup/enter-code': () => withBrand('Enter Verification Code'),
  '/signup/username': () => withBrand('Choose Display Name'),
  '/forgot-password': () => withBrand('Reset Password'),
  '/auth/callback': () => withBrand('Signing In')
};

/**
 * @param {string} symbol
 * @param {string} [companyName]
 */
export function tickerPageTitle(symbol, companyName) {
  const label = tickerHeadline(symbol, companyName);
  return withBrand(
    `${label} Stock Price, Chart, Daily, Weekly, Monthly and Annual Returns, OHLC and Trading Signals`
  );
}

/**
 * @param {string} symbol
 * @param {string} [companyName]
 */
export function historicalDataTitle(symbol, companyName) {
  const label = tickerHeadline(symbol, companyName);
  return withBrand(`${label} Historical Stock Price, OHLC Data and CSV Export`);
}

/**
 * @param {string} indexLabel e.g. "S&P 500"
 */
export function indexPageTitle(indexLabel) {
  return withBrand(
    `${indexLabel} Index Constituents, Stock Returns, Heatmap and Trading Signals`
  );
}

/**
 * @param {string} sectorLabel e.g. "Technology"
 * @param {string} [etfTicker] e.g. "XLK"
 */
export function sectorPageTitle(sectorLabel, etfTicker) {
  const etf = String(etfTicker || '')
    .toUpperCase()
    .trim();
  const etfPart = etf ? ` (${etf})` : '';
  return withBrand(
    `${sectorLabel} Sector${etfPart} Stock Heatmap, Returns, OHLC and Trading Signals`
  );
}

/**
 * @param {string} symbol
 * @param {'Daily'|'Weekly'|'Monthly'|'Quarterly'|'Annual'} period
 */
export function statPeriodTitle(symbol, period) {
  const sym = String(symbol || '').toUpperCase();
  return withBrand(
    `${sym} ${period} Stock Returns, Price History, OHLC Statistics and Return Table`
  );
}

/**
 * @param {string} symbol
 */
export function tickerReportTitle(symbol) {
  const sym = String(symbol || '').toUpperCase();
  return withBrand(
    `${sym} Stock Report, Returns, Drawdown, Seasonality, Relative Strength and FAQs`
  );
}

/**
 * @param {string} symbol
 * @param {'annual'|'monthly'} kind
 * @param {string} periodLabel
 */
export function tickerReportPeriodTitle(symbol, kind, periodLabel) {
  const sym = String(symbol || '').toUpperCase();
  if (kind === 'annual') {
    return withBrand(
      `${sym} Annual Stock Report, Returns, Drawdown and Seasonality for ${periodLabel}`
    );
  }
  return withBrand(
    `${sym} Monthly Stock Report, Returns, Drawdown and Seasonality for ${periodLabel}`
  );
}

/**
 * @param {string} symbol
 */
export function relativePerformanceTitle(symbol) {
  const sym = String(symbol || '').toUpperCase();
  return withBrand(
    `${sym} Relative Stock Performance vs Index, Excess Returns, Chart and Statistics`
  );
}
