// Polls pending limit/stop_limit paper orders (interval: paperJobRunner, default every 4h).

const supabaseService = require('../config/supabaseService');
const { executeFill } = require('../services/paper/orderEngine');
const { simulateFill } = require('../services/paper/executionSimulator');
const { getCurrentPrice } = require('../services/paper/pnlCalculator');

/**
 * @param {object} order
 * @param {number} currentPrice
 */
function shouldTrigger(order, currentPrice) {
  const side = String(order.side).toLowerCase();
  const type = String(order.order_type).toLowerCase();
  const limit = order.limit_price != null ? Number(order.limit_price) : null;
  const stop = order.stop_price != null ? Number(order.stop_price) : null;

  if (type === 'limit' && limit != null) {
    if (side === 'buy') return currentPrice <= limit;
    if (side === 'sell') return currentPrice >= limit;
  }

  if (type === 'stop_limit' && stop != null && side === 'sell') {
    return currentPrice <= stop;
  }

  return false;
}

async function checkPendingOrders() {
  const { data: orders, error } = await supabaseService
    .from('paper_orders')
    .select('*')
    .eq('status', 'pending')
    .in('order_type', ['limit', 'stop_limit']);

  if (error) throw error;
  if (!orders?.length) return { filled: 0 };

  let filled = 0;
  for (const order of orders) {
    try {
      const price = await getCurrentPrice(order.ticker);
      if (price == null) continue;
      if (!shouldTrigger(order, price)) continue;

      const remaining = Number(order.qty) - Number(order.filled_qty || 0);
      if (remaining <= 0) continue;

      const action = String(order.action || '').toUpperCase() || (String(order.side).toLowerCase() === 'buy' ? 'BTO' : 'STC');
      const fill = simulateFill(action, remaining, price);
      await executeFill(order.account_id, order, fill, price);
      filled += 1;
    } catch (err) {
      console.warn('[paper-pending-watcher] order', order.id, err?.message || err);
    }
  }

  return { filled };
}

module.exports = { checkPendingOrders, shouldTrigger };
