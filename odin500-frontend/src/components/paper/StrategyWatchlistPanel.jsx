import { useCallback, useEffect, useRef, useState } from 'react';
import { apiUrl } from '../../utils/apiOrigin.js';
import { fetchWithAuth } from '../../store/apiStore.js';
import { useWatchlistOptions } from '../../hooks/useWatchlistOptions.js';
import { pickWatchlistKeyForMerged, watchlistKindTag } from '../../utils/watchlistOptions.js';
import { buildWatchlistQuickRule, ruleTickerKey } from './strategyRuleUtils.js';

function IcoChevronDown({ className }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WatchlistKindTag({ kind }) {
  const label = watchlistKindTag(kind);
  if (!label) return null;
  return (
    <span
      className={
        'wl-flyout__select-item-tag' +
        (kind === 'user' ? ' wl-flyout__select-item-tag--user' : ' wl-flyout__select-item-tag--default')
      }
    >
      {label}
    </span>
  );
}

function LeaderTable({ title, rows, side, rules, busy, onAddRule, onAddToForm }) {
  const existing = new Set((rules || []).map(ruleTickerKey));

  return (
    <div className="paper-strategy-wl__col">
      <div className="paper-strategy-wl__col-head">
        <h5
          className={
            'paper-strategy-wl__col-title' +
            (side === 'long'
              ? ' paper-strategy-wl__col-title--long'
              : ' paper-strategy-wl__col-title--short')
          }
        >
          {title}
        </h5>
        {rows.length > 0 ? (
          <button
            type="button"
            className="paper-btn paper-btn--ghost paper-btn--sm"
            disabled={busy}
            onClick={() => onAddRule(rows, side)}
          >
            Add all
          </button>
        ) : null}
      </div>
      {rows.length === 0 ? (
        <p className="paper-strategy-muted">No {side} signals in this watchlist.</p>
      ) : (
        <ul className="paper-strategy-wl__list">
          {rows.map((row) => {
            const hasRule = existing.has(row.symbol);
            return (
              <li key={row.symbol} className="paper-strategy-wl__row">
                <span className="paper-strategy-wl__sym">{row.symbol}</span>
                <span className="paper-strategy-wl__bucket">{row.bucket}</span>
                <div className="paper-strategy-wl__row-actions">
                  <button
                    type="button"
                    className="paper-btn paper-btn--ghost paper-btn--sm"
                    disabled={busy}
                    onClick={() => onAddToForm([row.symbol])}
                    title="Add ticker to rule form"
                  >
                    Form
                  </button>
                  <button
                    type="button"
                    className="paper-btn paper-btn--ghost paper-btn--sm"
                    disabled={busy || hasRule}
                    onClick={() => onAddRule([row], side, true)}
                    title={hasRule ? 'Rule already exists for this ticker' : 'Add as strategy rule'}
                  >
                    {hasRule ? 'Added' : '+ Rule'}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function StrategyWatchlistPanel({
  savedWatchlistKey = '',
  rules = [],
  busy = false,
  onWatchlistKeyChange,
  onAddRule,
  onAddTickersToForm
}) {
  const { options, loading: optionsLoading, error: optionsError } = useWatchlistOptions();
  const [selectedKey, setSelectedKey] = useState('');
  const [ddOpen, setDdOpen] = useState(false);
  const [leaders, setLeaders] = useState({ longs: [], shorts: [], watchlist: null });
  const [signalsLoading, setSignalsLoading] = useState(false);
  const [signalsError, setSignalsError] = useState('');
  const ddRef = useRef(null);

  useEffect(() => {
    if (!options.length) return;
    setSelectedKey((prev) => pickWatchlistKeyForMerged(options, savedWatchlistKey || prev));
  }, [options, savedWatchlistKey]);

  const selected = options.find((o) => o.key === selectedKey) || options[0];

  const loadSignals = useCallback(async (key) => {
    if (!key) {
      setLeaders({ longs: [], shorts: [], watchlist: null });
      return;
    }
    setSignalsLoading(true);
    setSignalsError('');
    try {
      const res = await fetchWithAuth(
        apiUrl(`/api/paper/strategies/watchlist-signals?watchlist_key=${encodeURIComponent(key)}`),
        { method: 'GET' }
      );
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || 'Failed to load signals');
      setLeaders({
        longs: payload.longs || [],
        shorts: payload.shorts || [],
        watchlist: payload.watchlist || null
      });
    } catch (err) {
      setSignalsError(err?.message || 'Failed to load watchlist signals');
      setLeaders({ longs: [], shorts: [], watchlist: null });
    } finally {
      setSignalsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedKey) return;
    void loadSignals(selectedKey);
  }, [selectedKey, loadSignals]);

  useEffect(() => {
    if (!ddOpen) return;
    const onDoc = (e) => {
      if (ddRef.current && !ddRef.current.contains(e.target)) setDdOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [ddOpen]);

  function pickWatchlist(key) {
    setSelectedKey(key);
    setDdOpen(false);
    onWatchlistKeyChange?.(key);
  }

  async function handleAddRules(rows, side, single = false) {
    const list = single ? rows : rows;
    const existing = new Set((rules || []).map(ruleTickerKey));
    for (const row of list) {
      const sym = String(row.symbol || row).trim().toUpperCase();
      if (!sym || existing.has(sym)) continue;
      await onAddRule?.(buildWatchlistQuickRule(sym, side));
      existing.add(sym);
    }
  }

  return (
    <section className="paper-strategy-section paper-strategy-wl" data-tour="paper-strategy-watchlist">
      <h4 className="paper-strategy-section__title">Watchlist signals</h4>
      <p className="paper-strategy-muted paper-strategy-wl__intro">
        Pick a watchlist to see the strongest long and short Odin signals. Add tickers to your strategy
        rules in one click.
      </p>

      <div className="paper-strategy-wl__picker" ref={ddRef}>
        <span className="paper-field__label">Watchlist</span>
        <div className="wl-flyout__select-wrap">
          <button
            type="button"
            className="wl-flyout__select paper-strategy-wl__select"
            aria-haspopup="listbox"
            aria-expanded={ddOpen}
            disabled={optionsLoading || !options.length}
            onClick={() => setDdOpen((v) => !v)}
          >
            {selected ? (
              <span className="paper-strategy-wl__select-label">
                <WatchlistKindTag kind={selected.kind} />
                <span className="wl-flyout__select-item-name">{selected.name}</span>
              </span>
            ) : (
              <span className="wl-flyout__select-label">{optionsLoading ? 'Loading…' : '—'}</span>
            )}
            <IcoChevronDown className="wl-flyout__select-chev" />
          </button>
          {ddOpen && options.length > 0 ? (
            <ul className="wl-flyout__select-menu paper-strategy-wl__menu" role="listbox">
              {options.map((o) => (
                <li key={o.key} role="option" aria-selected={o.key === selectedKey}>
                  <button
                    type="button"
                    className={
                      'wl-flyout__select-item' + (o.key === selectedKey ? ' wl-flyout__select-item--active' : '')
                    }
                    onClick={() => pickWatchlist(o.key)}
                  >
                    <span className="wl-flyout__select-item-row">
                      <WatchlistKindTag kind={o.kind} />
                      <span className="wl-flyout__select-item-name">{o.name}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      {optionsError ? <p className="paper-strategy-err">{optionsError}</p> : null}
      {signalsError ? <p className="paper-strategy-err">{signalsError}</p> : null}

      {signalsLoading ? (
        <p className="paper-strategy-muted">Loading signal rankings…</p>
      ) : (
        <div className="paper-strategy-wl__grid">
          <LeaderTable
            title="Top 10 long"
            rows={leaders.longs}
            side="long"
            rules={rules}
            busy={busy}
            onAddRule={handleAddRules}
            onAddToForm={(syms) => onAddTickersToForm?.(syms)}
          />
          <LeaderTable
            title="Top 10 short"
            rows={leaders.shorts}
            side="short"
            rules={rules}
            busy={busy}
            onAddRule={handleAddRules}
            onAddToForm={(syms) => onAddTickersToForm?.(syms)}
          />
        </div>
      )}

      {leaders.watchlist?.symbolCount != null ? (
        <p className="paper-strategy-muted paper-strategy-wl__meta">
          {leaders.watchlist.symbolCount} ticker{leaders.watchlist.symbolCount === 1 ? '' : 's'} in watchlist
        </p>
      ) : null}
    </section>
  );
}
