// Pre-trade validation for paper orders.

const MAX_QTY = 10000;

/**
 * @param {{ action: string, ticker: string, qty: number, orderType?: string }} order
 * @param {{ cash_balance: number }} account
 * @param {number} currentPrice
 * @param {{ closableLongQty?: number, closableShortQty?: number }} [context]
 */
function validateOrder(order, account, currentPrice, context = {}) {
  const ticker = String(order.ticker || '').trim().toUpperCase();
  if (!ticker) {
    throw new Error('Ticker symbol is required');
  }

  const qty = Number(order.qty);
  if (!Number.isFinite(qty) || qty <= 0) {
    throw new Error('Quantity must be greater than zero');
  }
  if (qty > MAX_QTY) {
    throw new Error(`Quantity cannot exceed ${MAX_QTY}`);
  }

  const price = Number(currentPrice);
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(`No market price available for ${ticker}`);
  }

  const action = String(order.action || '').toUpperCase();
  if (!['BTO', 'STO', 'BTC', 'STC'].includes(action)) {
    throw new Error('Action must be one of BTO, STO, BTC, STC');
  }

  const isBuyCashFlow = action === 'BTO' || action === 'BTC';
  if (isBuyCashFlow) {
    const cost = qty * price * 1.002;
    const cash = Number(account.cash_balance);
    if (!Number.isFinite(cash) || cash < cost) {
      throw new Error('Insufficient cash for this order');
    }
  }

  const closableLong = Number(context.closableLongQty || 0);
  const closableShort = Number(context.closableShortQty || 0);

  if (action === 'STC' && qty > closableLong) {
    throw new Error(`Insufficient long lots to close: open long qty is ${closableLong}`);
  }
  if (action === 'BTC' && qty > closableShort) {
    throw new Error(`Insufficient short lots to close: open short qty is ${closableShort}`);
  }
}

module.exports = { validateOrder, MAX_QTY };
