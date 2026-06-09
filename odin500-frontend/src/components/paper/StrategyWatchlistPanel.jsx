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
  const [selected, setSelected] = useState(() => new Set());
  const checkAllRef = useRef(null);
  const existing = new Set((rules || []).map(ruleTickerKey));

  useEffect(() => {
    setSelected(new Set());
  }, [rows]);

  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.symbol));
  const someSelected = rows.some((r) => selected.has(r.symbol));
  const checkedCount = rows.filter((r) => selected.has(r.symbol)).length;

  useEffect(() => {
    const el = checkAllRef.current;
    if (el) el.indeterminate = someSelected && !allSelected;
  }, [someSelected, allSelected]);

  function toggleAll(checked) {
    if (checked) {
      setSelected(new Set(rows.map((r) => r.symbol)));
    } else {
      setSelected(new Set());
    }
  }

  function toggleOne(symbol, checked) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(symbol);
      else next.delete(symbol);
      return next;
    });
  }

  async function addRulesForChecked() {
    const checked = rows.filter((r) => selected.has(r.symbol));
    if (!checked.length) return;
    await onAddRule(checked, side);
  }

  function addFormForChecked() {
    const syms = rows.filter((r) => selected.has(r.symbol)).map((r) => r.symbol);
    if (!syms.length) return;
    onAddToForm(syms);
  }

  return (
    <div className="paper-strategy-wl__col">
      <div className="paper-strategy-wl__col-head">
        <label className="paper-strategy-wl__check-all" title="Select all">
          <input
            ref={checkAllRef}
            type="checkbox"
            className="paper-strategy-wl__checkbox"
            checked={allSelected}
            disabled={busy || rows.length === 0}
            onChange={(e) => toggleAll(e.target.checked)}
            aria-label={`Select all ${side} signals`}
          />
        </label>
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
        <div className="paper-strategy-wl__col-actions">
          <button
            type="button"
            className="paper-btn paper-btn--ghost paper-btn--sm"
            disabled={busy || checkedCount === 0}
            onClick={() => void addRulesForChecked()}
            title="Add checked tickers as strategy rules"
          >
            + Add rule
          </button>
          <button
            type="button"
            className="paper-btn paper-btn--ghost paper-btn--sm"
            disabled={busy || checkedCount === 0}
            onClick={addFormForChecked}
            title="Add checked tickers to the rule form"
          >
            + Form
          </button>
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="paper-strategy-muted">No {side} signals in this watchlist.</p>
      ) : (
        <div className="paper-strategy-wl__list-scroll">
          <ul className="paper-strategy-wl__list">
            {rows.map((row) => {
              const hasRule = existing.has(row.symbol);
              const isChecked = selected.has(row.symbol);
              return (
                <li key={row.symbol} className="paper-strategy-wl__row">
                  <label className="paper-strategy-wl__row-check">
                    <input
                      type="checkbox"
                      className="paper-strategy-wl__checkbox"
                      checked={isChecked}
                      disabled={busy}
                      onChange={(e) => toggleOne(row.symbol, e.target.checked)}
                      aria-label={`Select ${row.symbol}`}
                    />
                  </label>
                  <span className="paper-strategy-wl__sym">{row.symbol}</span>
                  <span className="paper-strategy-wl__bucket">{row.bucket}</span>
                  {hasRule ? (
                    <span className="paper-strategy-wl__has-rule" title="Rule already exists">
                      Rule
                    </span>
                  ) : (
                    <span className="paper-strategy-wl__has-rule paper-strategy-wl__has-rule--empty" aria-hidden />
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export function StrategyWatchlistPanel({
  savedWatchlistKey = '',
  rules = [],
  busy = false,
  saveError = '',
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
        apiUrl(
          `/api/paper/strategies/watchlist-signals?watchlist_key=${encodeURIComponent(key)}&limit=all`
        ),
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
    if (key !== savedWatchlistKey) {
      onWatchlistKeyChange?.(key);
    }
  }

  async function handleAddRules(rows, side) {
    const existing = new Set((rules || []).map(ruleTickerKey));
    for (const row of rows) {
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
        Pick a watchlist to see long and short Odin signals. Check tickers, then use + Add rule or + Form
        to apply them in bulk.
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
      {saveError ? <p className="paper-strategy-err">{saveError}</p> : null}
      {signalsError ? <p className="paper-strategy-err">{signalsError}</p> : null}

      {signalsLoading ? (
        <p className="paper-strategy-muted">Loading signal rankings…</p>
      ) : (
        <div className="paper-strategy-wl__grid">
          <LeaderTable
            title="Long signals"
            rows={leaders.longs}
            side="long"
            rules={rules}
            busy={busy}
            onAddRule={handleAddRules}
            onAddToForm={(syms) => onAddTickersToForm?.(syms)}
          />
          <LeaderTable
            title="Short signals"
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
