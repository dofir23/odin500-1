// Updates paper_positions + cash via increment_cash after fills.
// Supabase: config/supabaseService.js (service role for server-side writes).

const supabaseService = require('../../config/supabaseService');

/**
 * @param {string} accountId
 * @param {{ side: string, ticker: string }} order
 * @param {{ fillPrice: number, fillQty: number }} fill
 */
async function applyFill(accountId, order, fill) {
  const ticker = String(order.ticker || '').trim().toUpperCase();
  const side = String(order.side || '').toLowerCase();
  const fillPrice = Number(fill.fillPrice);
  const fillQty = Number(fill.fillQty);
  const cashDelta = side === 'buy' ? -(fillQty * fillPrice) : fillQty * fillPrice;

  const { error: cashErr } = await supabaseService.rpc('increment_cash', {
    p_account_id: accountId,
    p_amount: cashDelta
  });
  if (cashErr) throw cashErr;

  const { data: existing, error: posErr } = await supabaseService
    .from('paper_positions')
    .select('id, qty, avg_cost')
    .eq('account_id', accountId)
    .eq('ticker', ticker)
    .maybeSingle();

  if (posErr) throw posErr;

  const currentQty = Number(existing?.qty || 0);
  const signedFillQty = side === 'buy' ? fillQty : -fillQty;
  const newQty = Math.round((currentQty + signedFillQty) * 1000000) / 1000000;

  if (!existing) {
    if (newQty === 0) return;
    const { error: insErr } = await supabaseService.from('paper_positions').insert({
      account_id: accountId,
      ticker,
      qty: newQty,
      avg_cost: fillPrice,
      realized_pnl: 0
    });
    if (insErr) throw insErr;
    return;
  }

  let newAvgCost = Number(existing.avg_cost) || fillPrice;

  if (side === 'buy' && currentQty >= 0) {
    const totalCost = currentQty * (Number(existing.avg_cost) || 0) + fillQty * fillPrice;
    newAvgCost = newQty !== 0 ? totalCost / newQty : 0;
  } else if (side === 'sell' && currentQty > 0 && newQty > 0) {
    newAvgCost = Number(existing.avg_cost) || fillPrice;
  } else if (side === 'sell' && currentQty > 0 && newQty <= 0) {
    newAvgCost = newQty === 0 ? Number(existing.avg_cost) || fillPrice : fillPrice;
  } else if (side === 'buy' && currentQty < 0) {
    if (newQty < 0) {
      const shortQty = Math.abs(currentQty);
      const remainingShort = Math.abs(newQty);
      if (remainingShort > 0) {
        const totalCost =
          shortQty * (Number(existing.avg_cost) || 0) - fillQty * fillPrice;
        newAvgCost = totalCost / remainingShort;
      } else {
        newAvgCost = 0;
      }
    } else if (newQty > 0) {
      newAvgCost = fillPrice;
    } else {
      newAvgCost = Number(existing.avg_cost) || fillPrice;
    }
  } else if (side === 'sell' && currentQty <= 0) {
    const shortQty = Math.abs(currentQty);
    const addedShort = fillQty;
    const totalCost = shortQty * (Number(existing.avg_cost) || 0) + addedShort * fillPrice;
    newAvgCost = Math.abs(newQty) !== 0 ? totalCost / Math.abs(newQty) : 0;
  }

  const safeAvgCost =
    newQty === 0
      ? Number(existing.avg_cost) || fillPrice
      : Math.max(newAvgCost, 0) || Number(existing.avg_cost) || fillPrice;

  const { error: updErr } = await supabaseService
    .from('paper_positions')
    .update({
      qty: newQty,
      avg_cost: safeAvgCost,
      updated_at: new Date().toISOString()
    })
    .eq('id', existing.id);

  if (updErr) throw updErr;
}

module.exports = { applyFill };
