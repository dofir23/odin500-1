import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { createChart } from 'lightweight-charts';
import { getDocumentTheme, subscribeDocumentTheme } from '../../utils/documentTheme.js';
import {
  PAPER_PERF_RANGES,
  PAPER_CHART_COLORS,
  filterHistoryByRange,
  historyToChartPoints,
  rebaseToHundred,
  dedupeAscendingPoints
} from '../../utils/paperPerformanceUtils.js';

const CHART_HEIGHT = 280;

function chartOptionsForTheme(theme, width) {
  const light = theme === 'light';
  return {
    width,
    height: CHART_HEIGHT,
    layout: {
      background: { color: 'transparent' },
      textColor: light ? '#64748b' : '#94a3b8',
      attributionLogo: false
    },
    grid: {
      vertLines: { visible: false },
      horzLines: { color: light ? '#e2e8f0' : 'rgba(148, 163, 184, 0.12)' }
    },
    rightPriceScale: { borderVisible: false },
    timeScale: { borderVisible: false, timeVisible: true, secondsVisible: false }
  };
}

/**
 * @param {{
 *   accounts: Array<{ account_id: string, name: string, history: Array<{ snapshot_at: string, equity: number }> }>,
 *   loading?: boolean
 * }} props
 */
export function PortfolioCompareChart({ accounts = [], loading = false }) {
  const theme = useSyncExternalStore(subscribeDocumentTheme, getDocumentTheme, () => 'dark');
  const hostRef = useRef(null);
  const chartRef = useRef(null);
  const [range, setRange] = useState('6M');
  const [visible, setVisible] = useState(() => new Set());

  useEffect(() => {
    const ids = (accounts || []).map((a) => a.account_id).filter(Boolean);
    setVisible(new Set(ids));
  }, [accounts]);

  const seriesData = useMemo(() => {
    return (accounts || []).map((acct, idx) => {
      const filtered = filterHistoryByRange(acct.history || [], range);
      const pts = rebaseToHundred(historyToChartPoints(filtered));
      return {
        id: acct.account_id,
        name: acct.name || 'Account',
        color: PAPER_CHART_COLORS[idx % PAPER_CHART_COLORS.length],
        points: pts
      };
    });
  }, [accounts, range]);

  const activeSeries = seriesData.filter((s) => visible.has(s.id) && s.points.length >= 2);

  useEffect(() => {
    const el = hostRef.current;
    if (!el || activeSeries.length === 0) return undefined;

    const chart = createChart(el, chartOptionsForTheme(theme, el.clientWidth || 600));
    for (const s of activeSeries) {
      const line = chart.addLineSeries({
        color: s.color,
        lineWidth: 2,
        priceLineVisible: false,
        title: s.name
      });
      line.setData(dedupeAscendingPoints(s.points));
    }
    chart.timeScale().fitContent();
    chartRef.current = chart;

    const ro = new ResizeObserver(() => {
      if (hostRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: hostRef.current.clientWidth });
      }
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [theme, activeSeries]);

  function toggleAccount(id) {
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 1) next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div className="paper-card paper-compare-chart">
      <div className="paper-card__head">
        <div>
          <h2 className="paper-card__title">Compare performance</h2>
          <p className="paper-chart-card__hint">
            Each line starts at 100 for the selected period so you can see who is ahead, regardless of account size.
          </p>
        </div>
      </div>

      {/* <div className="paper-chart-card__toolbar">
        <div className="paper-seg" role="group" aria-label="Time range">
          <span className="paper-seg__label">Show</span>
          {PAPER_PERF_RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              className={'paper-seg__btn' + (range === r.id ? ' paper-seg__btn--active' : '')}
              aria-pressed={range === r.id}
              title={r.label}
              onClick={() => setRange(r.id)}
            >
              {r.short}
            </button>
          ))}
        </div>
      </div> */}

      <div className="paper-compare-chart__chips" role="group" aria-label="Accounts on chart">
        {seriesData.map((s) => (
          <button
            key={s.id}
            type="button"
            className={
              'paper-compare-chip' + (visible.has(s.id) ? ' paper-compare-chip--on' : ' paper-compare-chip--off')
            }
            aria-pressed={visible.has(s.id)}
            onClick={() => toggleAccount(s.id)}
          >
            <span className="paper-compare-chip__dot" style={{ background: s.color }} aria-hidden />
            {s.name}
          </button>
        ))}
      </div>

      <div className="paper-card__body">
        {loading ? (
          <div className="paper-skeleton paper-chart-host" style={{ minHeight: CHART_HEIGHT }} aria-busy="true" />
        ) : activeSeries.length === 0 ? (
          <div className="paper-chart-empty">
            <p className="paper-chart-empty__title">Not enough history yet</p>
            <p>Performance lines appear after snapshots are saved for your accounts. Try a longer time range or check back later.</p>
          </div>
        ) : (
          <div ref={hostRef} className="paper-chart-host" />
        )}
      </div>
    </div>
  );
}
