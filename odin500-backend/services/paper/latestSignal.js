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
  const sym = String(ticker || '')
    .trim()
    .toUpperCase();
  if (!sym) return null;

  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 45);
  const startStr = start.toISOString().slice(0, 10);
  const endStr = end.toISOString().slice(0, 10);

  const query = `
    SELECT \`Date\` AS dt, \`Signal\` AS sig
    FROM ${OHLC_SIGNALS_TABLE_FQN}
    WHERE \`Ticker\` = @ticker
      AND \`Date\` BETWEEN @start AND @end
    ORDER BY \`Date\` DESC
    LIMIT 1
  `;

  const [rows] = await bigquery.query({
    query,
    params: { ticker: sym, start: startStr, end: endStr }
  });

  const row = rows?.[0];
  if (!row) return null;
  return normalizeSignalBucket(row.sig);
}

module.exports = {
  getLatestSignalBucket,
  normalizeSignalBucket,
  signalSideFromBucket,
  VALID_BUCKETS
};
