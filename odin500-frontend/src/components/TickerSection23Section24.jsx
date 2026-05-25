import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemedDropdown } from './ThemedDropdown.jsx';
import { ChartInfoTip } from './ChartInfoTip.jsx';
import TradingChartLoader from './TradingChartLoader.jsx';
import { CHART_INFO_TIPS } from './chartInfoTips.js';
import {fetchJsonCached, getAuthToken, canFetchProtectedApi} from '../store/apiStore.js';
import { useReturnsChartFiltersMenuMode } from '../context/WatchlistDockContext.jsx';
import { ReturnsChartFiltersMenu } from './ReturnsChartFiltersMenu.jsx';
import { ReturnsChartClickableTitle } from './ReturnsChartClickableTitle.jsx';
import { ReturnsChartPieIcon } from './returnsChartToolbarIcons.jsx';
import { ReturnsChartToolbar } from './ReturnsChartToolbar.jsx';
import { ChartSectionIconActions } from './ChartSectionIconActions.jsx';
import { buildRelativeStrengthTickerHref } from '../utils/relativeStrengthNavigation.js';
import { buildTickerChartExportFilename } from '../utils/chartExportFilename.js';
import { formatRelativePerfPct } from '../utils/marketCalculations.js';
import { useGatedCsvDownload } from '../hooks/useGatedCsvDownload.js';
import { fmtPctSigned } from '../utils/formatDisplayNumber.js';

const GROUPS = [
  { id: 'sp500', apiIndex: 'SP500', label: 'S&P 500', benchmark: 'SPX', benchLabel: 'S&P 500' },
  { id: 'dow', apiIndex: 'Dow Jones', label: 'Dow Jones', benchmark: 'DJI', benchLabel: 'Dow Jones' },
  { id: 'nasdaq', apiIndex: 'Nasdaq 100', label: 'Nasdaq 100', benchmark: 'IXIC', benchLabel: 'Nasdaq 100' },
  { id: 'etf', apiIndex: 'ETF', label: 'ETF', benchmark: 'QQQ', benchLabel: 'ETF' },
  { id: 'other', apiIndex: 'Other', label: 'Other', benchmark: 'IWM', benchLabel: 'Other' }
];

const TF_ROWS = [
  { key: '1D', period: 'Last date' },
  { key: '5D', period: 'Week' },
  { key: '1M', period: 'Last Month' },
  { key: '3M', period: 'Last 3 months' },
  { key: '6M', period: 'Last 6 months' },
  { key: 'YTD', period: 'Year to Date (YTD)' },
  { key: '1Y', period: 'Last 1 year' },
  { key: '3Y', period: 'Last 3 years' },
  { key: '5Y', period: 'Last 5 years' },
  { key: '10Y', period: 'Last 10 years' },
  { key: '20Y', period: 'Last 20 years' }
];
const TABLE_ONLY_START_DATE = '2005-01-01';
const S24_TWENTY_Y_KEY = '20Y';
/** Minimum visible bar height (%) for non-zero returns so 1D/5D/1M stay readable. */
const S24_MIN_BAR_HEIGHT_PCT = 2.5;

/** Stable empty default — `= []` in params is a new array every render when the prop is omitted. */
const DEFAULT_INITIAL_SP500_ROWS = Object.freeze([]);

/** Dev-only: logs 1D / "Last date" pipeline. For prod builds, temporarily set to `true`. */
const DEBUG_BENCHMARK_TABLE_1D =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV) || false;

function yesterdayIso() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function pickDynamic(dynamicPeriods, periodName) {
  if (!periodName || !Array.isArray(dynamicPeriods)) return null;
  const row = dynamicPeriods.find((r) => r.period === periodName);
  const v = row?.totalReturn;
  return Number.isFinite(Number(v)) ? Number(v) : null;
}

function signedToneClass(v) {
  if (!Number.isFinite(Number(v))) return '';
  return Number(v) > 0 ? 'app-num--up' : Number(v) < 0 ? 'app-num--down' : '';
}

function pickTickerReturnsFromPayload(payload, tickerSym) {
  const u = String(tickerSym || '').toUpperCase().trim();
  if (!payload || !u) return null;
  if (payload.batch === true && payload.byTicker && payload.byTicker[u] != null) {
    const row = payload.byTicker[u];
    if (row && row.success === false) return null;
    return row;
  }
  if (!payload.batch && String(payload.ticker || '').toUpperCase() === u) return payload;
  return null;
}

function niceAxisBounds(rows) {
  const vals = rows.flatMap((r) => [r.bench, r.tick]).filter((v) => Number.isFinite(v));
  if (!vals.length) return { min: -5, max: 25, ticks: [-5, 0, 5, 10, 15, 20, 25] };
  const minV = Math.min(...vals);
  const maxV = Math.max(...vals);
  const spanRaw = Math.max(10, maxV - minV);
  const rough = spanRaw / 6;
  const base = 10 ** Math.floor(Math.log10(Math.max(rough, 1)));
  const ratio = rough / base;
  const niceMult = ratio <= 1 ? 1 : ratio <= 2 ? 2 : ratio <= 5 ? 5 : 10;
  const step = niceMult * base;
  const min = Math.floor((Math.min(-1, minV) - 0.5) / step) * step;
  const max = Math.ceil((Math.max(10, maxV) + 0.5) / step) * step;
  const ticks = [];
  for (let t = min; t <= max + 1e-9; t += step) {
    ticks.push(Math.round(t * 1000) / 1000);
  }
  return { min, max, ticks };
}

/** @param {number} axisMax @param {number} axisMin @param {number} value */
function chartYPct(axisMax, axisMin, value) {
  const range = axisMax - axisMin;
  if (!Number.isFinite(range) || range <= 0) return 50;
  return ((axisMax - value) / range) * 100;
}

/**
 * Bar geometry with a shared zero line (main axis) and per-column positive scale.
 * Non-20Y columns use `valueMax` = main axis max; 20Y uses its own max so long horizons stay visible.
 */
function s24BarGeomScaled(axisMin, axisMainMax, valueMax, v) {
  const z = chartYPct(axisMainMax, axisMin, 0);
  if (v == null || !Number.isFinite(Number(v))) {
    return { topPct: z, heightPct: 0, empty: true, dir: 'flat' };
  }
  const num = Number(v);
  const posCap = Math.max(axisMainMax, valueMax, 1e-9);
  if (num > 0) {
    let heightPct = (num / posCap) * z;
    if (heightPct > 0 && heightPct < S24_MIN_BAR_HEIGHT_PCT) heightPct = S24_MIN_BAR_HEIGHT_PCT;
    const topPct = z - heightPct;
    return { topPct, heightPct, empty: false, dir: 'up' };
  }
  if (num < 0) {
    const yv = chartYPct(axisMainMax, axisMin, num);
    let heightPct = Math.max(0, yv - z);
    if (heightPct > 0 && heightPct < S24_MIN_BAR_HEIGHT_PCT) heightPct = S24_MIN_BAR_HEIGHT_PCT;
    return { topPct: z, heightPct, empty: false, dir: 'down' };
  }
  return { topPct: z, heightPct: 0, empty: false, dir: 'flat' };
}

function s24BarValTopPct(geom) {
  if (geom.empty) return null;
  return geom.dir === 'down' ? geom.topPct + geom.heightPct : geom.topPct;
}

export function TickerSection23Section24({
  pageSymbol = '',
  prefetchedLongTickerReturns = null,
  prefetchedLongBenchReturns = null,
  prefetchedLongBenchSymbol = '',
  prefetchedLongBusy = false,
  onSectionBenchmarkSymbolChange,
  initialSp500Rows = DEFAULT_INITIAL_SP500_ROWS,
  onViewMore: onViewMoreProp,
  /** Relative Strength ticker page: IndexPage-style head selectors (ticker + index ETF). */
  rsPageSelectors = false,
  selectedTicker = '',
  onSelectedTickerChange,
  selectedBenchmarkSymbol = 'SPX',
  onSelectedBenchmarkSymbolChange,
  tickerSelectOptions = [],
  indexSelectOptions = []
}) {
  const navigate = useNavigate();
  const [groupId, setGroupId] = useState('sp500');
  const [groupRows, setGroupRows] = useState([]);
  const [ticker, setTicker] = useState(String(pageSymbol || '').toUpperCase());
  const [localTickerReturns, setLocalTickerReturns] = useState(null);
  const [localBenchReturns, setLocalBenchReturns] = useState(null);
  const [localReturnsBusy, setLocalReturnsBusy] = useState(false);
  const [loadingGroup, setLoadingGroup] = useState(false);
  const coreReturnsCacheRef = useRef(new Map());
  const filtersMenuMode = useReturnsChartFiltersMenuMode();

  const activeGroup = useMemo(() => GROUPS.find((g) => g.id === groupId) || GROUPS[0], [groupId]);

  const benchSymbol = useMemo(() => {
    if (rsPageSelectors) {
      return String(selectedBenchmarkSymbol || 'SPX').toUpperCase().trim();
    }
    return String(activeGroup.benchmark || '').toUpperCase().trim();
  }, [rsPageSelectors, selectedBenchmarkSymbol, activeGroup.benchmark]);

  const benchLabel = rsPageSelectors
    ? indexSelectOptions.find((o) => o.id === benchSymbol)?.label || benchSymbol || 'Index'
    : activeGroup.benchLabel;

  const onViewMore = useCallback(() => {
    if (typeof onViewMoreProp === 'function') {
      onViewMoreProp();
      return;
    }
    const sym = String(pageSymbol || ticker || '').trim();
    navigate(buildRelativeStrengthTickerHref(sym));
    queueMicrotask(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
  }, [navigate, onViewMoreProp, pageSymbol, ticker]);

  /** Avoid effect loops: default prop `initialSp500Rows = []` is a new [] every render when omitted. */
  const initialSp500RowsSig = useMemo(() => {
    const arr = initialSp500Rows;
    if (!Array.isArray(arr) || !arr.length) return '';
    return `${arr.length}:${arr.map((r) => String(r?.symbol || '')).join(',')}`;
  }, [initialSp500Rows]);

  useEffect(() => {
    if (rsPageSelectors) {
      const next = String(selectedTicker || pageSymbol || '').toUpperCase();
      if (next) setTicker(next);
      return;
    }
    setTicker(String(pageSymbol || '').toUpperCase());
  }, [pageSymbol, rsPageSelectors, selectedTicker]);

  const usePrefetchLong = useMemo(() => {
    if (rsPageSelectors) return false;
    const symPage = String(pageSymbol || '').toUpperCase().trim();
    const tick = String(ticker || '').toUpperCase().trim();
    const prefB = String(prefetchedLongBenchSymbol || '').toUpperCase().trim();
    return tick === symPage && benchSymbol === prefB;
  }, [pageSymbol, ticker, benchSymbol, prefetchedLongBenchSymbol, rsPageSelectors]);

  const tickerReturns = usePrefetchLong ? prefetchedLongTickerReturns : localTickerReturns;
  const benchReturns = usePrefetchLong ? prefetchedLongBenchReturns : localBenchReturns;
  const loadingReturns =
    loadingGroup || (usePrefetchLong ? prefetchedLongBusy : localReturnsBusy);

  useEffect(() => {
    onSectionBenchmarkSymbolChange?.(benchSymbol);
  }, [benchSymbol, onSectionBenchmarkSymbolChange]);

  useEffect(() => {
    if (rsPageSelectors) return;
    let cancelled = false;
    async function loadGroupRows() {
      if (!canFetchProtectedApi()) return;
      setLoadingGroup(true);
      try {
        const rowsFromProp =
          activeGroup.id === 'sp500' && Array.isArray(initialSp500Rows) && initialSp500Rows.length
            ? initialSp500Rows
            : null;
        const data = rowsFromProp
          ? { data: rowsFromProp }
          : (
              await fetchJsonCached({
                path: '/api/market/ticker-details',
                method: 'POST',
                body: { index: activeGroup.apiIndex, period: 'last-1-year' },
                ttlMs: 10 * 60 * 1000
              })
            ).data;
        if (cancelled) return;
        const list = Array.isArray(data?.data) ? data.data : [];
        const sorted = [...list].sort((a, b) =>
          String(a.symbol || '').localeCompare(String(b.symbol || ''), undefined, { sensitivity: 'base' })
        );
        setGroupRows(sorted);
        const syms = new Set(sorted.map((r) => String(r.symbol || '').toUpperCase()));
        if (!syms.has(ticker)) {
          setTicker(sorted[0]?.symbol ? String(sorted[0].symbol).toUpperCase() : '');
        }
      } catch {
        if (!cancelled) setGroupRows([]);
      } finally {
        if (!cancelled) setLoadingGroup(false);
      }
    }
    loadGroupRows();
    return () => {
      cancelled = true;
    };
  }, [activeGroup.apiIndex, activeGroup.id, initialSp500RowsSig, rsPageSelectors]);

  /**
   * When the peer ticker differs from the page symbol, load only missing core payloads.
   * This avoids refetching both symbols when only one dropdown changes.
   */
  useEffect(() => {
    let cancelled = false;
    const symPage = String(pageSymbol || '').toUpperCase().trim();
    const tick = String(ticker || '').toUpperCase().trim();
    const bench = benchSymbol;
    const prefB = String(prefetchedLongBenchSymbol || '').toUpperCase().trim();
    const usePrefetch = tick === symPage && bench === prefB;

    if (!canFetchProtectedApi() || !tick || !bench) {
      setLocalTickerReturns(null);
      setLocalBenchReturns(null);
      setLocalReturnsBusy(false);
      return () => {
        cancelled = true;
      };
    }

    if (usePrefetch) {
      setLocalTickerReturns(null);
      setLocalBenchReturns(null);
      setLocalReturnsBusy(false);
      return () => {
        cancelled = true;
      };
    }

    async function getCoreReturns(sym) {
      const u = String(sym || '').toUpperCase().trim();
      if (!u) return null;
      const key = `${u}|${TABLE_ONLY_START_DATE}|${yesterdayIso()}`;
      if (coreReturnsCacheRef.current.has(key)) {
        return coreReturnsCacheRef.current.get(key);
      }
      const res = await fetchJsonCached({
        path: '/api/market/ticker-core-returns',
        method: 'POST',
        body: {
          ticker: u,
          customStartDate: TABLE_ONLY_START_DATE,
          customEndDate: yesterdayIso()
        },
        ttlMs: 5 * 60 * 1000
      });
      const payload = pickTickerReturnsFromPayload(res.data, u) || (res.data?.ticker ? res.data : null);
      coreReturnsCacheRef.current.set(key, payload);
      return payload;
    }

    (async () => {
      setLocalReturnsBusy(true);
      try {
        const [tickData, benchData] = await Promise.all([getCoreReturns(tick), getCoreReturns(bench)]);
        if (cancelled) return;
        setLocalTickerReturns(tickData);
        setLocalBenchReturns(benchData);
      } catch {
        if (!cancelled) {
          setLocalTickerReturns(null);
          setLocalBenchReturns(null);
        }
      } finally {
        if (!cancelled) setLocalReturnsBusy(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ticker, benchSymbol, pageSymbol, prefetchedLongBenchSymbol]);

  const rows = useMemo(() => {
    const dynT = tickerReturns?.performance?.dynamicPeriods || [];
    const dynB = benchReturns?.performance?.dynamicPeriods || [];
    return TF_ROWS.map((tf) => {
      const bench = pickDynamic(dynB, tf.period);
      const tick = pickDynamic(dynT, tf.period);
      const diff =
        Number.isFinite(bench) && Number.isFinite(tick)
          ? Number(tick) - Number(bench)
          : null;
      return { tf: tf.key, bench, tick, diff };
    });
  }, [tickerReturns, benchReturns]);

  useEffect(() => {
    if (!DEBUG_BENCHMARK_TABLE_1D || loadingReturns) return;
    const period1d = TF_ROWS[0].period;
    const dynT = tickerReturns?.performance?.dynamicPeriods || [];
    const dynB = benchReturns?.performance?.dynamicPeriods || [];
    const rowT = dynT.find((r) => r.period === period1d);
    const rowB = dynB.find((r) => r.period === period1d);
    const tick = pickDynamic(dynT, period1d);
    const bench = pickDynamic(dynB, period1d);
    const diff =
      Number.isFinite(bench) && Number.isFinite(tick) ? Number(tick) - Number(bench) : null;

    // eslint-disable-next-line no-console -- intentional debug trace for 1D / Last date
    console.groupCollapsed('[TickerSection23Section24:1D / Last date]');
    // eslint-disable-next-line no-console
    console.log('context', {
      ticker,
      benchmark: activeGroup.benchmark,
      benchLabel: activeGroup.benchLabel,
      usePrefetchLong,
      tickerAsOf: tickerReturns?.asOfDate,
      benchAsOf: benchReturns?.asOfDate
    });
    // eslint-disable-next-line no-console
    console.log('period key we match on', JSON.stringify(period1d));
    // eslint-disable-next-line no-console
    console.log('all dynamic period labels (ticker)', dynT.map((r) => r.period));
    // eslint-disable-next-line no-console
    console.log('all dynamic period labels (benchmark)', dynB.map((r) => r.period));
    // eslint-disable-next-line no-console
    console.log('raw row ticker "Last date"', rowT ?? '(no row with exact period match)');
    // eslint-disable-next-line no-console
    console.log('raw row benchmark "Last date"', rowB ?? '(no row with exact period match)');
    // eslint-disable-next-line no-console
    console.log('pickDynamic totals', { tick1d: tick, bench1d: bench, diff1d: diff });
    const row1d = rows.find((r) => r.tf === '1D');
    // eslint-disable-next-line no-console
    console.log('computed table row (1D)', row1d);
    // eslint-disable-next-line no-console
    console.log(
      'why 0%? (same calendar start/end often means one trading bar → ~0% return)',
      {
        tickerSameDay:
          rowT?.startDate && rowT?.endDate ? rowT.startDate === rowT.endDate : null,
        benchSameDay:
          rowB?.startDate && rowB?.endDate ? rowB.startDate === rowB.endDate : null,
        tickerPrices: rowT ? { start: rowT.startPrice, end: rowT.endPrice } : null,
        benchPrices: rowB ? { start: rowB.startPrice, end: rowB.endPrice } : null
      }
    );
    // eslint-disable-next-line no-console
    console.groupEnd();
  }, [
    loadingReturns,
    tickerReturns,
    benchReturns,
    ticker,
    activeGroup.benchmark,
    activeGroup.benchLabel,
    usePrefetchLong,
    rows
  ]);

  const rowsMain = useMemo(() => rows.filter((r) => r.tf !== S24_TWENTY_Y_KEY), [rows]);
  const row20Y = useMemo(() => rows.find((r) => r.tf === S24_TWENTY_Y_KEY) ?? null, [rows]);

  const axisMain = useMemo(() => niceAxisBounds(rowsMain), [rowsMain]);
  const axis20Y = useMemo(() => {
    if (!row20Y) return axisMain;
    const b = niceAxisBounds([row20Y]);
    return {
      min: axisMain.min,
      max: Math.max(b.max, axisMain.max),
      ticks: b.ticks
    };
  }, [row20Y, axisMain]);

  const s24Ticks = useMemo(() => {
    const ticks = axisMain.ticks.map((t) => ({
      key: `s24y-${t}`,
      value: t,
      topPct: chartYPct(axisMain.max, axisMain.min, t),
      is20YCap: false
    }));
    // if (
    //   row20Y &&
    //   Number.isFinite(axis20Y.max) &&
    //   axis20Y.max > axisMain.max + 1e-6
    // ) {
    //   ticks.push({
    //     key: 's24y-20y-cap',
    //     value: axis20Y.max,
    //     topPct: 0,
    //     is20YCap: true
    //   });
    // }
    return ticks;
  }, [axisMain, axis20Y, row20Y]);

  const s24ZeroTopPct = useMemo(() => chartYPct(axisMain.max, axisMain.min, 0), [axisMain]);

  const s24Cols = useMemo(
    () =>
      rows.map((r) => {
        const valueMax = r.tf === S24_TWENTY_Y_KEY ? axis20Y.max : axisMain.max;
        return {
          tf: r.tf,
          benchV: r.bench,
          tickV: r.tick,
          bench: s24BarGeomScaled(axisMain.min, axisMain.max, valueMax, r.bench),
          tick: s24BarGeomScaled(axisMain.min, axisMain.max, valueMax, r.tick)
        };
      }),
    [rows, axisMain, axis20Y]
  );
  const s24NCols = Math.max(1, rows.length);
  const s24GapPx = s24NCols > 12 ? 4 : s24NCols > 8 ? 6 : 8;
  const s24BarMaxPx = s24NCols > 12 ? 9 : s24NCols > 8 ? 11 : 13;

  const s24CardRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const s24FsRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const s24PlotRef = useRef(/** @type {HTMLDivElement | null} */ (null));

  const exportSymbol = String(pageSymbol || ticker || '').trim().toUpperCase() || 'chart';
  const benchSlug = String(benchSymbol || activeGroup.benchmark || activeGroup.id || 'benchmark').toLowerCase();

  const exportS24Csv = useCallback(() => {
    const header = ['period', 'benchmark_pct', 'ticker_pct', 'difference_pct'];
    const lines = [header.join(',')];
    const esc = (v) => {
      const s = v == null ? '' : String(v);
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    for (const r of rows) {
      lines.push(
        [esc(r.tf), esc(r.bench), esc(r.tick), esc(r.diff)].join(',')
      );
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exportSymbol}-vs-${benchSlug}-benchmark-bars.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [rows, exportSymbol, benchSlug]);

  const exportS24CsvClick = useGatedCsvDownload(exportS24Csv);

  const buildS24SnapshotFilename = useCallback(
    () => buildTickerChartExportFilename('benchmark-bars', `${exportSymbol}-vs-${benchSlug}`),
    [exportSymbol, benchSlug]
  );

  const s24ChartActionsDisabled = loadingReturns || !rows.length;

  const rsPageSelectorControls =
    rsPageSelectors && (tickerSelectOptions.length || indexSelectOptions.length) ? (
      <div className="ticker-rs-controls ticker-rs-controls--inline">
        {tickerSelectOptions.length ? (
          <ThemedDropdown
            wideLabel
            style={{ minWidth: 0, maxWidth: '100%' }}
            value={ticker}
            options={tickerSelectOptions}
            onChange={(id) => {
              const next = String(id || '').toUpperCase();
              setTicker(next);
              onSelectedTickerChange?.(next);
            }}
            title="Ticker"
            ariaLabelPrefix="Ticker"
            labelFallback={ticker || '—'}
          />
        ) : null}
        {indexSelectOptions.length ? (
          <ThemedDropdown
            wideLabel
            style={{ minWidth: 0, maxWidth: '100%' }}
            value={benchSymbol}
            options={indexSelectOptions}
            onChange={(id) => {
              const next = String(id || '').toUpperCase();
              onSelectedBenchmarkSymbolChange?.(next);
            }}
            title="Index"
            ariaLabelPrefix="Index"
            labelFallback={benchLabel || 'S&P 500'}
          />
        ) : null}
      </div>
    ) : null;

  const benchmarkControls = (
    <div className="ticker-s23s24__controls">
      <ThemedDropdown
        className="ticker-s23s24__select-dd"
        style={{ width: '100%' }}
        size="sm"
        wideLabel
        value={ticker}
        options={groupRows.map((r) => {
          const s = String(r.symbol || '').toUpperCase();
          return { id: s, label: s };
        })}
        onChange={setTicker}
        title="Ticker"
        ariaLabelPrefix="Ticker"
        disabled={!groupRows.length}
        labelFallback="—"
      />
      <ThemedDropdown
        className="ticker-s23s24__select-dd"
        style={{ width: '100%' }}
        size="sm"
        wideLabel
        value={groupId}
        options={GROUPS.map((g) => ({ id: g.id, label: g.label }))}
        onChange={setGroupId}
        title="Index group"
        ariaLabelPrefix="Group"
      />
    </div>
  );

  return (
    <section className="ticker-s23s24">
      <div className="ticker-s23s24__card ticker-s23">
        {rsPageSelectors ? (
          <div className="ticker-s23s24__head-row ticker-subh-with-tip ticker-subh-with-tip--in-card ticker-rs-selector-head">
            <div className="ticker-rs-selector-head__left">
              <div className="flex shrink-0 align-centers">
                <ReturnsChartPieIcon />
              </div>
              <div className="ticker-subh-left">
                <ReturnsChartClickableTitle
                  className="ticker-subh ticker-subh--flex uppercase"
                  onClick={onViewMore}
                >
                  Relative Strength
                </ReturnsChartClickableTitle>
                <ChartInfoTip tip={CHART_INFO_TIPS.tickerCompareBars} align="start" />
              </div>
            </div>
            {rsPageSelectorControls ? (
              <div className="ticker-rs-selector-head__right">{rsPageSelectorControls}</div>
            ) : null}
          </div>
        ) : (
          <div className="ticker-s23s24__head-row ticker-s23s24__head-row--title-only">
            <div className="ticker-card__h-with-tip">
              <div className="inline-flex shrink-0 items-center gap-2 uppercase">
                <ReturnsChartPieIcon />
                <ReturnsChartClickableTitle className="ticker-annual-figma__badge uppercase" onClick={onViewMore}>
                  Relative Strength
                </ReturnsChartClickableTitle>
              </div>
              <ChartInfoTip tip={CHART_INFO_TIPS.tickerCompareBars} align="start" />
            </div>
          </div>
        )}
        <div className="ticker-s23__body">
          <table className="ticker-s23__table">
            <thead>
              <tr>
                <th> Time</th>
                <th>{ticker || 'Ticker'}</th>
                <th>{benchLabel}</th>
                <th>Difference</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.tf}>
                  <th scope="row">{r.tf}</th>
                  <td className={signedToneClass(r.tick)}>{fmtPctSigned(r.tick)}</td>
                  <td className={signedToneClass(r.bench)}>{fmtPctSigned(r.bench)}</td>
                  <td className={signedToneClass(r.diff)}>{fmtPctSigned(r.diff)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div ref={s24CardRef} className="ticker-s23s24__card ticker-s24">
        <div className="ticker-s24__title-row">
          <div className="ticker-card__h-with-tip">
            <div className="inline-flex shrink-0 items-center gap-2 uppercase">
              <ReturnsChartPieIcon />
              <ReturnsChartClickableTitle className="ticker-annual-figma__badge uppercase" onClick={onViewMore}>
                Benchmark vs Ticker Bars
              </ReturnsChartClickableTitle>
            </div>
            <ChartInfoTip tip={CHART_INFO_TIPS.tickerCompareBars} align="start" />
          </div>
          <div className="ticker-s24__title-actions">
            <ReturnsChartToolbar
              className="ticker-s24__chart-toolbar-icons"
              showViewMore={false}
              showTableToggle={false}
              onDownload={exportS24CsvClick}
              downloadDisabled={s24ChartActionsDisabled}
            />
            <ChartSectionIconActions
              snapshotRootRef={s24CardRef}
              plotHostRef={s24PlotRef}
              fullscreenTargetRef={s24FsRef}
              buildFilename={buildS24SnapshotFilename}
              disabled={s24ChartActionsDisabled}
              exportPreviewAlt={`Benchmark vs ${ticker || 'ticker'} bars chart`}
              exportModalTitle="Export chart"
            />
          </div>
        </div>
        {!filtersMenuMode && !rsPageSelectors ? benchmarkControls : null}
        <div ref={s24FsRef} className="ticker-chart-fs-shell ticker-s24__chart-shell">
          {loadingReturns ? (
            <div className="chart-viz-loading-wrap ticker-s24__viz-loading">
              <TradingChartLoader
                label="Loading benchmark comparison…"
                sublabel={`${benchLabel} vs ${ticker || 'ticker'}`}
              />
            </div>
          ) : (
            <>
              <div
                ref={s24PlotRef}
                className="ticker-s24__chart ticker-s17__chart"
                style={{
                  '--ticker-s17-cols': String(s24NCols),
                  '--ticker-s17-gap': `${s24GapPx}px`,
                  '--ticker-s17-bar-max': `${s24BarMaxPx}px`
                }}
              >
                <div className="ticker-s17__yaxis">
                  <div className="ticker-s17__yaxis-area">
                    {s24Ticks.map((t) => (
                      <span key={t.key} className="ticker-s17__yval" style={{ top: `${t.topPct}%` }}>
                        {fmtPctSigned(t.value)}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="ticker-s17__plot">
                  <div className="ticker-s17__plot-area">
                    <div className="ticker-s17__viz">
                      {s24Ticks.map((t) => (
                        <span key={`g-${t.key}`} className="ticker-s17__grid" style={{ top: `${t.topPct}%` }} />
                      ))}
                      <span className="ticker-s17__zero" style={{ top: `${s24ZeroTopPct}%` }} />
                      <div className="ticker-s17__bars">
                        {s24Cols.map((c) => (
                          <div key={c.tf} className="ticker-s17__col">
                            <div className="ticker-s24__pair-zones">
                              <div className="ticker-s17__bar-zone ticker-s24__bar-zone--twin">
                                <div
                                  className={
                                    'ticker-s24__pillar ticker-s24__pillar--bench ticker-s24__pillar--' +
                                    c.bench.dir +
                                    (c.bench.empty ? ' ticker-s24__pillar--empty' : '')
                                  }
                                  style={{ top: `${c.bench.topPct}%`, height: `${c.bench.heightPct}%` }}
                                  title={
                                    c.bench.empty
                                      ? `${benchLabel}: —`
                                      : `${benchLabel}: ${formatRelativePerfPct(c.benchV)}`
                                  }
                                />
                                {!c.bench.empty && s24BarValTopPct(c.bench) != null ? (
                                  <span
                                    className={
                                      'ticker-s17__bar-val ticker-s17__bar-val--' +
                                      c.bench.dir +
                                      ' ticker-s24__bar-val'
                                    }
                                    style={{ top: `${s24BarValTopPct(c.bench)}%` }}
                                  >
                                    {formatRelativePerfPct(c.benchV)}
                                  </span>
                                ) : null}
                              </div>
                              <div className="ticker-s17__bar-zone ticker-s24__bar-zone--twin">
                                <div
                                  className={
                                    'ticker-s24__pillar ticker-s24__pillar--tick ticker-s24__pillar--' +
                                    c.tick.dir +
                                    (c.tick.empty ? ' ticker-s24__pillar--empty' : '')
                                  }
                                  style={{ top: `${c.tick.topPct}%`, height: `${c.tick.heightPct}%` }}
                                  title={
                                    c.tick.empty ? `${ticker || 'Ticker'}: —` : `${ticker || 'Ticker'}: ${formatRelativePerfPct(c.tickV)}`
                                  }
                                />
                                {!c.tick.empty && s24BarValTopPct(c.tick) != null ? (
                                  <span
                                    className={
                                      'ticker-s17__bar-val ticker-s17__bar-val--' +
                                      c.tick.dir +
                                      ' ticker-s24__bar-val'
                                    }
                                    style={{ top: `${s24BarValTopPct(c.tick)}%` }}
                                  >
                                    {formatRelativePerfPct(c.tickV)}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="ticker-s17__xlabels">
                      {s24Cols.map((c) => (
                        <span key={`lab-${c.tf}`} className="ticker-s17__lab">
                          {c.tf}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="ticker-s24__legend">
              <span>
                  <i className="ticker-s24__dot ticker-s24__dot--tick" />
                  {ticker || 'Ticker'}
                </span>
                <span>
                  <i className="ticker-s24__dot ticker-s24__dot--bench" />
                  {benchSymbol || activeGroup.benchmark}
                </span>
                
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

