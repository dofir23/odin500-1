// Slippage model for paper market fills (0.05%).

const SLIPPAGE_RATE = 0.0005;

/**
 * @param {'buy'|'sell'} side
 * @param {number} qty
 * @param {number} marketPrice
 * @returns {{ fillPrice: number, fillQty: number, slippage: number }}
 */
function simulateFill(side, qty, marketPrice) {
  const price = Number(marketPrice);
  const quantity = Number(qty);
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error('Unable to simulate fill: invalid market price');
  }
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error('Unable to simulate fill: invalid quantity');
  }

  const slip = price * SLIPPAGE_RATE;
  const fillPrice =
    side === 'buy' ? price + slip : price - slip;

  return {
    fillPrice: Math.round(fillPrice * 10000) / 10000,
    fillQty: quantity,
    slippage: Math.round(slip * 10000) / 10000
  };
}

module.exports = { simulateFill, SLIPPAGE_RATE };
