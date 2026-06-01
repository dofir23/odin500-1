// Hourly portfolio equity snapshots for all paper accounts.
// Pattern: services/snapshotRefresher.js (setInterval from index.js).

const supabaseService = require('../config/supabaseService');
const { enrichPositionsWithPnl, calcEquity } = require('../services/paper/pnlCalculator');

async function runPaperSnapshot() {
  const { data: accounts, error } = await supabaseService.from('paper_accounts').select('id, cash_balance');
  if (error) throw error;
  if (!accounts?.length) return { count: 0 };

  let inserted = 0;
  for (const account of accounts) {
    const { data: positions, error: posErr } = await supabaseService
      .from('paper_positions')
      .select('*')
      .eq('account_id', account.id)
      .neq('qty', 0);

    if (posErr) {
      console.warn('[paper-snapshot] positions error:', posErr.message);
      continue;
    }

    const enriched = await enrichPositionsWithPnl(positions || []);
    const equity = calcEquity(account, enriched);
    const now = new Date().toISOString();

    const { error: insErr } = await supabaseService.from('paper_portfolio_snapshots').insert({
      account_id: account.id,
      equity,
      cash: account.cash_balance,
      snapshot_at: now
    });

    if (insErr) {
      console.warn('[paper-snapshot] insert error:', insErr.message);
      continue;
    }
    inserted += 1;
  }

  return { count: inserted };
}

module.exports = { runPaperSnapshot };
