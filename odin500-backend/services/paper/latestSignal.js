// Latest Odin signal bucket per ticker (BigQuery signals table — same source as ohlc-signals-indicator).

const bigquery = require('../../config/bigquery');

const OHLC_SIGNALS_TABLE_FQN =
  process.env.OHLC_SIGNALS_TABLE_FQN || '`extended-byway-454621-s6.sp500data1.Test`';

const VALID_BUCKETS = new Set(['L1', 'L2', 'L3', 'S1', 'S2', 'S3', 'N']);

function bqCellToPlain(v) {
  if (v == null) return null;
  if (typeof v === 'object' && v.value !== undefined) return v.value;
  if (v instanceof Date) return v.toISOString().split('T')[0];
  return v;
}

function normalizeSignalBucket(sig) {
  if (sig == null || sig === '') return 'N';
  const s = String(bqCellToPlain(sig) ?? sig)
    .trim()
    .toUpperCase();
  if (!s || s === 'NULL') return 'N';
  if (VALID_BUCKETS.has(s)) return s;
  if (/^L1/.test(s)) return 'L1';
  if (/^L2/.test(s)) return 'L2';
  if (s.startsWith('L')) return 'L3';
  if (/^S1/.test(s)) return 'S1';
  if (/^S2/.test(s)) return 'S2';
  if (s.startsWith('S')) return 'S3';
  return 'N';
}

function signalSideFromBucket(bucket) {
  const k = String(bucket || 'N').toUpperCase();
  if (k === 'L1' || k === 'L2' || k === 'L3') return 'long';
  if (k === 'S1' || k === 'S2' || k === 'S3') return 'short';
  return 'neutral';
}

/**
 * @param {string} ticker
 * @returns {Promise<string|null>} L1|S1|N etc., or null if unavailable
 */
async function getLatestSignalBucket(ticker) {
  const map = await getLatestSignalsForTickers([ticker]);
  const sym = String(ticker || '')
    .trim()
    .toUpperCase();
  return map.get(sym) ?? null;
}

/**
 * Latest Odin bucket per ticker (one BigQuery round-trip).
 * @param {string[]} tickers
 * @returns {Promise<Map<string, string>>}
 */
async function getLatestSignalsForTickers(tickers) {
  const uniq = [
    ...new Set(
      (tickers || [])
        .map((t) => String(t || '').trim().toUpperCase())
        .filter(Boolean)
    )
  ];
  const out = new Map();
  if (!uniq.length) return out;

  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 45);
  const startStr = start.toISOString().slice(0, 10);
  const endStr = end.toISOString().slice(0, 10);

  const query = `
    WITH ranked AS (
      SELECT
        \`Ticker\` AS ticker,
        \`Signal\` AS sig,
        ROW_NUMBER() OVER (PARTITION BY \`Ticker\` ORDER BY \`Date\` DESC) AS rn
      FROM ${OHLC_SIGNALS_TABLE_FQN}
      WHERE \`Ticker\` IN UNNEST(@tickers)
        AND \`Date\` BETWEEN @start AND @end
    )
    SELECT ticker, sig FROM ranked WHERE rn = 1
  `;

  const [rows] = await bigquery.query({
    query,
    params: { tickers: uniq, start: startStr, end: endStr }
  });

  for (const row of rows || []) {
    const sym = String(row.ticker || bqCellToPlain(row.ticker) || '')
      .trim()
      .toUpperCase();
    if (!sym) continue;
    out.set(sym, normalizeSignalBucket(row.sig));
  }
  return out;
}

module.exports = {
  getLatestSignalBucket,
  getLatestSignalsForTickers,
  normalizeSignalBucket,
  signalSideFromBucket,
  VALID_BUCKETS
};
