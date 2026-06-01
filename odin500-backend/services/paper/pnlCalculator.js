// Live P&L: latest close from BigQuery OHLC (same table as utils/watchlistUtils fetchOHLC).
// No Redis price:${ticker} cache exists in this codebase.

const bigquery = require('../../config/bigquery');

const OHLC_TABLE = '`extended-byway-454621-s6.sp500data1.DailyOHLC200MAData`';

function bqArray(arr) {
  return arr.map((s) => `'${String(s).replace(/'/g, "\\'")}'`).join(',');
}

/**
 * @param {string[]} symbols
 * @returns {Promise<Map<string, number>>}
 */
async function fetchLatestClosePrices(symbols) {
  const list = [...new Set((symbols || []).map((s) => String(s).trim().toUpperCase()).filter(Boolean))];
  const map = new Map();
  if (list.length === 0) return map;

  const q = `
    SELECT ticker, close_price AS close
    FROM ${OHLC_TABLE}
    WHERE ticker IN (${bqArray(list)})
    QUALIFY ROW_NUMBER() OVER (PARTITION BY ticker ORDER BY market_date DESC) = 1
  `;
  const [job] = await bigquery.createQueryJob({ query: q });
  const [rows] = await job.getQueryResults();
  rows.forEach((r) => {
    const close = r.close != null ? Number(r.close) : null;
    if (close != null && Number.isFinite(close)) {
      map.set(String(r.ticker).toUpperCase(), close);
    }
  });
  return map;
}

/**
 * @param {string} ticker
 * @returns {Promise<number|null>}
 */
async function getCurrentPrice(ticker) {
  const sym = String(ticker || '').trim().toUpperCase();
  if (!sym) return null;
  const map = await fetchLatestClosePrices([sym]);
  return map.get(sym) ?? null;
}

/**
 * @param {Array<{ ticker: string, qty: number, avg_cost: number }>} positions
 */
async function enrichPositionsWithPnl(positions) {
  const open = (positions || []).filter((p) => Number(p.qty) !== 0);
  const symbols = open.map((p) => p.ticker);
  const priceMap = await fetchLatestClosePrices(symbols);

  return open.map((p) => {
    const qty = Number(p.qty);
    const avgCost = Number(p.avg_cost) || 0;
    const currentPrice = priceMap.get(String(p.ticker).toUpperCase()) ?? null;
    const marketValue =
      currentPrice != null ? Math.round(qty * currentPrice * 100) / 100 : null;
    let unrealizedPnl = null;
    let unrealizedPnlPct = null;
    if (currentPrice != null && avgCost > 0) {
      unrealizedPnl = Math.round((currentPrice - avgCost) * qty * 100) / 100;
      unrealizedPnlPct = Math.round(((currentPrice - avgCost) / avgCost) * 10000) / 100;
    }
    return {
      ...p,
      current_price: currentPrice,
      market_value: marketValue,
      unrealized_pnl: unrealizedPnl,
      unrealized_pnl_pct: unrealizedPnlPct
    };
  });
}

/**
 * @param {{ cash_balance: number }} account
 * @param {Array<{ market_value?: number|null }>} positions
 */
function calcEquity(account, positions) {
  const cash = Number(account.cash_balance) || 0;
  const mv = (positions || []).reduce((sum, p) => {
    const v = p.market_value != null ? Number(p.market_value) : 0;
    return sum + (Number.isFinite(v) ? v : 0);
  }, 0);
  return Math.round((cash + mv) * 100) / 100;
}

module.exports = {
  getCurrentPrice,
  fetchLatestClosePrices,
  enrichPositionsWithPnl,
  calcEquity
};
