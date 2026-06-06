import { useState } from 'react';

import { StrategyRuleForm } from './StrategyRuleForm.jsx';

import { StrategyRulesList } from './StrategyRulesList.jsx';

import { StrategyExecutionLog } from './StrategyExecutionLog.jsx';

import { StrategyWatchlistPanel } from './StrategyWatchlistPanel.jsx';

import { AutomatedAccountBanner } from './AutomatedAccountBanner.jsx';



export function StrategyPanel({

  strategy,

  binding,

  rules,

  executionLog,

  strategyActive,

  loading,

  error,

  onAddRule,

  onUpdateRule,

  onDeleteRule,

  onPatchStrategy,

  onToggleActive,

  onRunOnce,

  onRefetch

}) {

  const [busy, setBusy] = useState(false);

  const [runMsg, setRunMsg] = useState('');

  const [editingRule, setEditingRule] = useState(null);

  const [tickerSeed, setTickerSeed] = useState(null);



  if (loading) {

    return <p className="paper-strategy-muted">Loading strategy…</p>;

  }



  if (!strategy) {

    return (

      <div className="paper-strategy-empty">

        <p>No strategy linked to this portfolio yet.</p>

        <p className="paper-strategy-muted">

          Use <strong>New strategy account</strong> in the header to create an automated portfolio, or bind a

          strategy from the API.

        </p>

      </div>

    );

  }



  const paused = !strategyActive;



  async function wrap(fn) {

    setBusy(true);

    setRunMsg('');

    try {

      await fn();

      await onRefetch?.();

    } finally {

      setBusy(false);

    }

  }



  function appendTickersToForm(symbols) {

    setTickerSeed({ symbols, nonce: Date.now() });

  }



  return (

    <div className="paper-strategy-panel">

      <AutomatedAccountBanner />

      {error ? <p className="paper-strategy-err">{error}</p> : null}



      <div className="paper-strategy-panel__head">

        <div>

          <h3 className="paper-strategy-panel__title">

            {strategy.name}

            {strategyActive ? (

              <span className="wl-flyout__select-item-tag wl-flyout__select-item-tag--auto paper-strategy-panel__auto-tag">

                Auto

              </span>

            ) : null}

          </h3>

          <p className="paper-strategy-muted">

            Status:{' '}

            <span className={paused ? 'paper-strategy-paused' : 'paper-strategy-live'}>

              {paused ? 'Paused' : 'Active'}

            </span>

            {binding?.last_run_at ? (
              <span className="paper-strategy-panel__last-run">
                {' · Last run '}
                {new Date(binding.last_run_at).toLocaleString()}
              </span>
            ) : null}

            {binding?.last_error ? (

              <span className="paper-strategy-err"> · {binding.last_error}</span>

            ) : null}

          </p>

        </div>

        <div className="paper-strategy-panel__actions">

          <button

            type="button"

            className="paper-btn paper-btn--ghost"

            disabled={busy}

            onClick={() => void wrap(() => onToggleActive(!strategyActive))}

          >

            {strategyActive ? 'Pause' : 'Resume'}

          </button>

          <button

            type="button"

            className="paper-btn paper-btn--primary"

            disabled={busy || paused}

            onClick={() =>

              void wrap(async () => {

                const out = await onRunOnce();

                setRunMsg(

                  `Run complete — triggered: ${out?.triggered ?? 0}, failed: ${out?.failed ?? 0}`

                );

              })

            }

          >

            {busy ? 'Running…' : 'Run now'}

          </button>

        </div>

      </div>



      {runMsg ? <p className="paper-strategy-run-msg">{runMsg}</p> : null}



      <StrategyWatchlistPanel

        savedWatchlistKey={strategy.watchlist_key || ''}

        rules={rules}

        busy={busy}

        onWatchlistKeyChange={(key) =>

          void wrap(() => onPatchStrategy?.({ watchlist_key: key }))

        }

        onAddRule={(payload) => void wrap(() => onAddRule(payload))}

        onAddTickersToForm={appendTickersToForm}

      />



      <section className="paper-strategy-section">

        <h4 className="paper-strategy-section__title">Rules</h4>

        <StrategyRulesList

          rules={rules}

          busy={busy}

          editingRuleId={editingRule?.id}

          onEdit={(rule) => {

            setEditingRule(rule);

            setTickerSeed(null);

          }}

          onDelete={(ruleId) =>

            void wrap(async () => {

              if (editingRule?.id === ruleId) setEditingRule(null);

              await onDeleteRule(ruleId);

            })

          }

        />

        <StrategyRuleForm

          busy={busy}

          editingRule={editingRule}

          tickerSeed={tickerSeed}

          onCancelEdit={() => setEditingRule(null)}

          onSubmit={(payload) =>

            void wrap(async () => {

              if (editingRule?.id) {

                await onUpdateRule(editingRule.id, payload);

                setEditingRule(null);

              } else {

                const list = Array.isArray(payload) ? payload : [payload];

                for (const item of list) {

                  await onAddRule(item);

                }

              }

            })

          }

        />

      </section>



      <section className="paper-strategy-section">

        <h4 className="paper-strategy-section__title">Execution log</h4>

        <StrategyExecutionLog log={executionLog} />

      </section>



      <p className="paper-strategy-docs">

        Strategies evaluate on the server schedule (~5 min by default). Odin signal rules use L1–S3 / N

        buckets. Buy/Short rules can add qty each run up to your <strong>max position limit</strong>. Sell/Cover

        rules can use a fixed qty or <strong>ALL</strong> to close the full open position. Add exit rules (e.g.

        Sell when signal turns short) to flatten before the next entry.

      </p>

    </div>

  );

}

