/** @typedef {import('driver.js').DriveStep} DriveStep */

/** @returns {DriveStep[]} */
export function buildPaperStrategyCreateSteps() {
  return [
    {
      element: '[data-tour="paper-new-strategy-account"]',
      popover: {
        title: 'Create a strategy account',
        description:
          'Start here to open a dedicated paper portfolio with automated rules. You will name the account, the strategy, and add at least one rule.',
        side: 'bottom',
        align: 'start'
      }
    },
    {
      element: '[data-tour="paper-wizard-step-account"]',
      popover: {
        title: 'Step 1 — Portfolio name',
        description: 'Give your automated portfolio a label (e.g. Tech momentum). This appears in the account dropdown.',
        side: 'bottom',
        align: 'start'
      }
    },
    {
      element: '[data-tour="paper-wizard-step-strategy"]',
      popover: {
        title: 'Step 2 — Strategy name',
        description: 'Name the strategy that holds your rules. One strategy can bind to this paper account.',
        side: 'bottom',
        align: 'start'
      }
    },
    {
      element: '[data-tour="paper-wizard-step-rules"]',
      popover: {
        title: 'Step 3 — Add rules',
        description:
          'Add rules using Odin signal buckets, price thresholds, or tickers from your watchlist. You need at least one rule before finishing.',
        side: 'top',
        align: 'start'
      }
    }
  ];
}
