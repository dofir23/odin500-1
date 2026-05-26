import { useMemo, useRef, useSyncExternalStore } from 'react';
import { StatsCmpChartSkeleton } from './ChartSkeletons.jsx';
import { StatsCmpChartToolbarHead } from './StatsCmpChartToolbarHead.jsx';
import { useChartFullscreenPlotSize } from '../hooks/useChartFullscreenPlotSize.js';
import { chartSvgPreserveAspectRatio, tickerSvgPlotStyle } from '../utils/tickerChartResize.js';
import { applyRelativeStrengthSnapshotCloneFixes } from '../utils/relativeStrengthChartExport.js';
import { getDocumentTheme, subscribeDocumentTheme } from '../utils/documentTheme.js';
import { fmtPct, fmtPctSigned } from '../utils/formatDisplayNumber.js';

export function ExcessReturnLineChart({
  mode,
  ticker,
  benchmarkIndex,
  startYear,
  endYear,
  selectedYear,
  startDate,
  endDate,
  theme = 'dark',
  rows = [],
  benchmarkOptions = [],
  onBenchmarkChange = () => {},
  controls = null,
  showDataTable = false,
  onToggleDataTable,
  onDownloadCsv,
  csvDisabled = false,
  loading = false,
  /** Optional: format x-axis period labels (Relative Strength stats charts). */
  formatXAxisLabel = null,
  /** When set by `TickerChartResizeScope` via cloneElement. */
  plotHeight = null
}) {
  const W = 1020;
  const H = 300;
  const padL = 58;
  const padR = 18;
  const padT = 16;
  const padB = 48;
  const iw = W - padL - padR;
  const ih = H - padT - padB;
  const vals = rows.map((r) => Number(r.excessReturn)).filter(Number.isFinite);
  const minV = vals.length ? Math.min(0, ...vals) : -8;
  const maxV = vals.length ? Math.max(0, ...vals) : 8;
  const span = Math.max(1, maxV - minV);
  const yMin = minV - span * 0.1;
  const yMax = maxV + span * 0.1;
  const y = (v) => padT + ((yMax - v) / (yMax - yMin)) * ih;
  const x = (i) => padL + (iw * i) / Math.max(1, rows.length - 1);
  const zeroY = y(0);
  const path = rows
    .map((r, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(r.excessReturn)}`)
    .join(' ');
  const area = rows.length
    ? `${path} L ${x(rows.length - 1)} ${zeroY} L ${x(0)} ${zeroY} Z`
    : '';

  const sectionRef = useRef(null);
  const plotHostRef = useRef(null);
  const exportSymbol = `${ticker}-vs-${benchmarkIndex}`;
  const chartTheme = useSyncExternalStore(subscribeDocumentTheme, getDocumentTheme, () => 'dark');
  const fsPlotSize = useChartFullscreenPlotSize(sectionRef);
  const exportOnclone = useMemo(
    () => (clonedDoc, clonedRoot) =>
      applyRelativeStrengthSnapshotCloneFixes(clonedDoc, clonedRoot, chartTheme === 'light'),
    [chartTheme]
  );

  const resizeChrome = fsPlotSize != null || (plotHeight != null && Number.isFinite(Number(plotHeight)));
  const hPx =
    fsPlotSize != null ? null : resizeChrome && plotHeight != null ? Math.round(Number(plotHeight)) : null;
  const svgPlotStyle =
    fsPlotSize != null
      ? tickerSvgPlotStyle(null, { fullscreen: true })
      : resizeChrome && hPx != null
        ? tickerSvgPlotStyle(hPx)
        : undefined;
  const rootClass = ['stats-cmp-chart', resizeChrome ? 'stats-cmp-chart--plot-resize' : ''].filter(Boolean).join(' ');

  return (
    <section ref={sectionRef} className={rootClass}>
      <StatsCmpChartToolbarHead
        sectionRef={sectionRef}
        plotHostRef={plotHostRef}
        controls={controls}
        benchmarkIndex={benchmarkIndex}
        benchmarkOptions={benchmarkOptions}
        onBenchmarkChange={onBenchmarkChange}
        showDataTable={showDataTable}
        onToggleDataTable={onToggleDataTable}
        onDownloadCsv={onDownloadCsv}
        csvDisabled={csvDisabled}
        exportDisabled={loading || !rows.length}
        exportChartSlug={`rs-excess-${mode}`}
        exportSymbol={exportSymbol}
        exportPreviewAlt={`${ticker} excess return vs ${benchmarkIndex} chart`}
        onclone={exportOnclone}
      />
      {loading ? (
        <StatsCmpChartSkeleton variant="line" />
      ) : !rows.length ? (
        <div className="stats-cmp-chart__state">No data available for selected range.</div>
      ) : (
        <div ref={plotHostRef} className="stats-cmp-chart__plot-host">
          <div className="stats-cmp-chart__legend">
            <span>
              <i className="stats-cmp-chart__sw stats-cmp-chart__sw--line" /> Excess ({ticker} - {benchmarkIndex})
            </span>
          </div>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="stats-cmp-chart__svg"
            preserveAspectRatio={chartSvgPreserveAspectRatio(fsPlotSize != null)}
            style={svgPlotStyle}
          >
            {[0, 0.25, 0.5, 0.75, 1].map((k) => {
              const t = yMin + (yMax - yMin) * k;
              const yy = y(t);
              return (
                <g key={`yg-${k}`}>
                  <line x1={padL} y1={yy} x2={W - padR} y2={yy} className="stats-cmp-chart__grid" />
                  <text x={padL - 8} y={yy} textAnchor="end" dominantBaseline="middle" className="stats-cmp-chart__y-axis">
                    {fmtPctSigned(t)}
                  </text>
                </g>
              );
            })}
            <line x1={padL} y1={zeroY} x2={W - padR} y2={zeroY} className="stats-cmp-chart__zero" />
            <path d={area} className="stats-cmp-chart__area" />
            <path d={path} className="stats-cmp-chart__line" />
            {rows.map((r, i) => {
              const periodStr = String(r.period ?? '');
              const xText = typeof formatXAxisLabel === 'function' ? formatXAxisLabel(periodStr) : periodStr;
              return (
                <g key={r.period}>
                  <circle cx={x(i)} cy={y(r.excessReturn)} r="3" className="stats-cmp-chart__dot" />
                  <text x={x(i)} y={y(r.excessReturn) - 8} textAnchor="middle" className="stats-cmp-chart__line-label">
                    {fmtPctSigned(r.excessReturn)}
                  </text>
                  {i % Math.max(1, Math.ceil(rows.length / 12)) === 0 || i === rows.length - 1 ? (
                    <text x={x(i)} y={H - 14} textAnchor="middle" className="stats-cmp-chart__x" title={periodStr}>
                      {xText}
                    </text>
                  ) : null}
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </section>
  );
}
