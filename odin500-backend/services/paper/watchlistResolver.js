const supabaseService = require('../../config/supabaseService');
const { getTickersByGroupId } = require('../../utils/watchlistUtils');
const {
  getLatestSignalsForTickers,
  signalSideFromBucket
} = require('./latestSignal');

const LONG_RANK = { L1: 3, L2: 2, L3: 1 };
const SHORT_RANK = { S1: 3, S2: 2, S3: 1 };

function longRank(bucket) {
  return LONG_RANK[String(bucket || '').toUpperCase()] || 0;
}

function shortRank(bucket) {
  return SHORT_RANK[String(bucket || '').toUpperCase()] || 0;
}

/**
 * @param {string} userId
 * @param {string} watchlistKey e.g. usr:uuid or def:Dow Jones
 */
async function resolveWatchlistMeta(userId, watchlistKey) {
  const key = String(watchlistKey || '').trim();
  if (!key) return null;

  if (key.startsWith('usr:')) {
    const id = key.slice(4);
    const { data: wl, error } = await supabaseService
      .from('watchlists')
      .select('id, name, watchlist_items(tickers(symbol))')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    if (!wl) return null;
    const symbols = [
      ...new Set(
        (wl.watchlist_items || [])
          .map((i) => i.tickers?.symbol)
          .filter(Boolean)
          .map((s) => String(s).trim().toUpperCase())
      )
    ];
    return { key, name: wl.name || 'Untitled', kind: 'user', symbols };
  }

  if (key.startsWith('def:')) {
    const groupName = key.slice(4);
    const { data: groups, error } = await supabaseService.from('market_groups').select('id, name');
    if (error) throw error;
    const group = (groups || []).find((g) => String(g.name || '').trim() === groupName);
    if (!group) return null;
    const tickers = await getTickersByGroupId(group.id);
    const symbols = [
      ...new Set(
        (tickers || [])
          .map((t) => String(t.symbol || '').trim().toUpperCase())
          .filter(Boolean)
      )
    ];
    return { key, name: groupName, kind: 'default', symbols };
  }

  return null;
}

/**
 * @param {string} userId
 * @param {string} watchlistKey
 * @param {{ limit?: number }} [opts]
 */
async function getWatchlistSignalLeaders(userId, watchlistKey, opts = {}) {
  const limit = Math.min(Math.max(Number(opts.limit) || 10, 1), 50);
  const meta = await resolveWatchlistMeta(userId, watchlistKey);
  if (!meta) {
    const err = new Error('Watchlist not found');
    err.status = 404;
    throw err;
  }

  const signalMap = await getLatestSignalsForTickers(meta.symbols);
  const rows = meta.symbols.map((symbol) => {
    const bucket = signalMap.get(symbol) || 'N';
    return {
      symbol,
      bucket,
      side: signalSideFromBucket(bucket),
      longRank: longRank(bucket),
      shortRank: shortRank(bucket)
    };
  });

  const longs = rows
    .filter((r) => r.longRank > 0)
    .sort((a, b) => b.longRank - a.longRank || a.symbol.localeCompare(b.symbol))
    .slice(0, limit)
    .map(({ symbol, bucket, longRank: rank }) => ({ symbol, bucket, rank }));

  const shorts = rows
    .filter((r) => r.shortRank > 0)
    .sort((a, b) => b.shortRank - a.shortRank || a.symbol.localeCompare(b.symbol))
    .slice(0, limit)
    .map(({ symbol, bucket, shortRank: rank }) => ({ symbol, bucket, rank }));

  return {
    watchlist: {
      key: meta.key,
      name: meta.name,
      kind: meta.kind,
      symbolCount: meta.symbols.length
    },
    longs,
    shorts
  };
}

module.exports = {
  resolveWatchlistMeta,
  getWatchlistSignalLeaders
};
