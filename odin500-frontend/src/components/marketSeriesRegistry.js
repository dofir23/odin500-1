/** Rotating chart colors for Other Markets (ETFs) rows. */
const OTHER_PALETTE = [
  { color: '#3b82f6', badge: '#1e3a8a', tone: 'blue' },
  { color: '#2563eb', badge: '#172554', tone: 'blue' },
  { color: '#6366f1', badge: '#312e81', tone: 'indigo' },
  { color: '#8b5cf6', badge: '#4c1d95', tone: 'purple' },
  { color: '#7a2fff', badge: '#5b21b6', tone: 'purple' },
  { color: '#06b6d4', badge: '#155e75', tone: 'cyan' },
  { color: '#10b981', badge: '#064e3b', tone: 'green' },
  { color: '#22c55e', badge: '#14532d', tone: 'green' },
  { color: '#eab308', badge: '#713f12', tone: 'gold' },
  { color: '#f59e0b', badge: '#78350f', tone: 'gold' },
  { color: '#ff6b00', badge: '#9a3412', tone: 'orange' },
  { color: '#ef4444', badge: '#7f1d1d', tone: 'red' },
  { color: '#ec4899', badge: '#831843', tone: 'pink' },
  { color: '#94a3b8', badge: '#334155', tone: 'gray' },
  { color: '#64748b', badge: '#1e293b', tone: 'gray' },
  { color: '#0f766e', badge: '#134e4a', tone: 'teal' }
];

/**
 * Client list — Other Markets (ETFs & global indices).
 * Each row: [key, shortLabel, ohlcTicker, optionalFundName]
 */
const OTHER_MARKET_ROWS = [
  ['SPY', 'S&P 500 ETF', 'SPY', 'SPDR S&P 500 ETF Trust'],
  ['SSO', 'Ultra S&P 500', 'SSO', 'ProShares Ultra S&P 500'],
  ['SPXL', 'S&P 500 Bull 3X', 'SPXL', 'Direxion Daily S&P 500 Bull 3X Shares'],
  ['RSP', 'S&P 500 Eq Weight', 'RSP', 'Invesco S&P 500 Equal Weight ETF'],
  ['QQQ', 'QQQ Trust', 'QQQ', 'Invesco QQQ Trust'],
  ['QLD', 'Ultra QQQ', 'QLD', 'ProShares Ultra QQQ'],
  ['TQQQ', 'UltraPro QQQ', 'TQQQ', 'ProShares UltraPro QQQ'],
  ['DIA', 'Dow Jones ETF', 'DIA', 'SPDR Dow Jones Industrial Average ETF Trust'],
  ['WEBL', 'Dow Internet Bull 3X', 'WEBL', 'Direxion Daily Dow Jones Internet Bull 3X Shares'],
  ['IWF', 'Russell 1000 Growth', 'IWF', 'iShares Russell 1000 Growth ETF'],
  ['OM_XLK', 'Technology', 'XLK', 'Technology Select Sector SPDR Fund'],
  ['OM_XLV', 'Healthcare', 'XLV', 'Health Care Select Sector SPDR Fund'],
  ['OM_XLY', 'Cons. Discretionary', 'XLY', 'Consumer Discretionary Select Sector SPDR Fund'],
  ['OM_XLC', 'Communication', 'XLC', 'Communication Services Select Sector SPDR Fund'],
  ['OM_XLF', 'Financials', 'XLF', 'Financial Select Sector SPDR Fund'],
  ['OM_XLI', 'Industrials', 'XLI', 'Industrial Select Sector SPDR Fund'],
  ['OM_XLP', 'Cons. Staples', 'XLP', 'Consumer Staples Select Sector SPDR Fund'],
  ['OM_XLU', 'Utilities', 'XLU', 'Utilities Select Sector SPDR Fund'],
  ['OM_XLB', 'Materials', 'XLB', 'Materials Select Sector SPDR Fund'],
  ['OM_XLRE', 'Real Estate', 'XLRE', 'Real Estate Select Sector SPDR Fund'],
  ['OM_XLE', 'Energy', 'XLE', 'Energy Select Sector SPDR Fund'],
  ['MDY', 'S&P MidCap 400', 'MDY', 'SPDR S&P MidCap 400 ETF Trust'],
  ['SPMD', 'Mid Cap ETF', 'SPMD', 'SPDR Portfolio Mid Cap ETF'],
  ['SH', 'Short S&P 500', 'SH', 'ProShares Short S&P500'],
  ['SDS', 'UltraShort S&P 500', 'SDS', 'ProShares UltraShort S&P500'],
  ['SPXS', 'S&P 500 Bear 3X', 'SPXS', 'Direxion Daily S&P 500 Bear 3X Shares'],
  ['PSQ', 'Short QQQ', 'PSQ', 'ProShares Short QQQ'],
  ['QID', 'UltraShort QQQ', 'QID', 'ProShares UltraShort QQQ'],
  ['SQQQ', 'UltraPro Short QQQ', 'SQQQ', 'ProShares UltraPro Short QQQ'],
  ['RWM', 'Short Russell 2000', 'RWM', 'ProShares Short Russell2000'],
  ['N225', 'Nikkei 225', 'N225', 'Nikkei 225'],
  ['FTSE', 'FTSE 100', 'FTSE', 'FTSE 100 Index'],
  ['FCHI', 'CAC 40', 'FCHI', 'CAC 40 Index'],
  ['HSI', 'Hang Seng', 'HSI', 'Hang Seng Index'],
  ['TA35TA', 'Tel Aviv 35', 'TA35.TA', 'Tel Aviv 35 Index'],
  ['IBEX', 'IBEX 35', 'Ibex', 'IBEX 35 Index'],
  ['GLD', 'Gold', 'GLD', 'SPDR Gold Shares'],
  ['SLV', 'Silver', 'SLV', 'iShares Silver Trust'],
  ['USO', 'Oil', 'USO', 'United States Oil Fund'],
  ['UNG', 'Natural Gas', 'UNG', 'United States Natural Gas Fund']
];

function buildOtherMarketSeries() {
  return OTHER_MARKET_ROWS.map(([key, label, ticker, addon], i) => {
    const pal = OTHER_PALETTE[i % OTHER_PALETTE.length];
    return {
      key,
      label,
      ticker,
      addon,
      color: pal.color,
      badge: pal.badge,
      tone: pal.tone,
      group: 'other'
    };
  });
}

export const MARKET_SERIES = [
  /** `symbol` = short label in UI (e.g. DJI); `ticker` = OHLC / API symbol (e.g. DIA). */
  { key: 'NDX', label: 'Nasdaq 100', ticker: 'QQQ', symbol: 'NDX', color: '#7a2fff', badge: '#5b21b6', tone: 'purple', group: 'us' },
  { key: 'INDU', label: 'Dow Jones', ticker: 'DIA', symbol: 'DJI', color: '#ff6b00', badge: '#9a3412', tone: 'orange', group: 'us' },
  { key: 'SPX', label: 'S&P 500', ticker: 'SPY', symbol: 'SPX', color: '#56208E', badge: '#1e40af', tone: 'blue', group: 'us' },

  { key: 'XLB', label: 'Materials', ticker: 'XLB', addon: 'Select Sector SPDR Fund', color: '#6b7280', badge: '#374151', tone: 'gray', group: 'sector' },
  { key: 'XLK', label: 'Technology', ticker: 'XLK', addon: 'Select Sector SPDR Fund', color: '#00b894', badge: '#065f46', tone: 'teal', group: 'sector' },
  { key: 'XLF', label: 'Financials', ticker: 'XLF', addon: 'Select Sector SPDR Fund', color: '#ff3b3b', badge: '#7f1d1d', tone: 'red', group: 'sector' },
  { key: 'XLV', label: 'Healthcare', ticker: 'XLV', color: '#812046', badge: '#075985', tone: 'sky', group: 'sector' },
  { key: 'XLI', label: 'Industrials', ticker: 'XLI', addon: 'Select Sector SPDR Fund', color: '#a16207', badge: '#422006', tone: 'brown', group: 'sector' },
  { key: 'XLE', label: 'Energy', ticker: 'XLE', addon: 'Select Sector SPDR Fund', color: '#d4af37', badge: '#78350f', tone: 'gold', group: 'sector' },
  { key: 'XLY', label: 'Consumer Discretionary', ticker: 'XLY', addon: 'Select Sector SPDR Fund', color: '#95658A', badge: '#7c2d12', tone: 'orange', group: 'sector' },
  { key: 'XLP', label: 'Consumer Staples', ticker: 'XLP', addon: 'Select Sector SPDR Fund', color: '#22c55e', badge: '#14532d', tone: 'green', group: 'sector' },
  { key: 'XLU', label: 'Utilities', ticker: 'XLU', addon: 'Select Sector SPDR Fund', color: '#a78bfa', badge: '#4c1d95', tone: 'purple', group: 'sector' },
  { key: 'XLRE', label: 'Real Estate', ticker: 'XLRE', addon: 'Select Sector SPDR Fund', color: '#ec4899', badge: '#831843', tone: 'pink', group: 'sector' },
  { key: 'XLC', label: 'Communication Services', ticker: 'XLC', addon: 'Select Sector SPDR Fund', color: '#06b6d4', badge: '#155e75', tone: 'cyan', group: 'sector' },

  ...buildOtherMarketSeries()
];

export const META_BY_KEY = Object.fromEntries(MARKET_SERIES.map((s) => [s.key, s]));
export const TICKER_BY_KEY = Object.fromEntries(MARKET_SERIES.map((s) => [s.key, s.ticker]));
export const DEFAULT_SELECTED_KEYS = ['INDU', 'SPX', 'NDX', 'XLK'];
