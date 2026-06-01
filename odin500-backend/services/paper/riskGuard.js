// Pre-trade validation for paper orders.

const MAX_QTY = 10000;

/**
 * @param {{ side: string, ticker: string, qty: number, orderType?: string }} order
 * @param {{ cash_balance: number }} account
 * @param {number} currentPrice
 */
function validateOrder(order, account, currentPrice) {
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

  const side = String(order.side || '').toLowerCase();
  if (side !== 'buy' && side !== 'sell') {
    throw new Error('Side must be buy or sell');
  }

  if (side === 'buy') {
    const cost = qty * price;
    const cash = Number(account.cash_balance);
    if (!Number.isFinite(cash) || cash < cost) {
      throw new Error('Insufficient cash for this buy order');
    }
  }
}

module.exports = { validateOrder, MAX_QTY };
