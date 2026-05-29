import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { TickerSymbolCombobox } from '../components/TickerSymbolCombobox.jsx';
import { TickerReportContent } from '../components/tickerReport/TickerReportContent.jsx';
import {
  formatMonthShort,
  getLatestReportPeriod,
  getMonthsForYear,
  getReportYears,
  getTickerReport,
  hasExactReport,
  isMonthlyReportYear
} from '../data/tickerReports/registry.js';
import { usePageSeo } from '../seo/usePageSeo.js';
import { downloadTickerReportCsv, downloadTickerReportPdf } from '../utils/tickerReportExport.js';
import { sanitizeTickerPageInput } from '../utils/tickerUrlSync.js';
import '../styles/ticker-report.css';

export default function TickerReportPage() {
  const { symbol: symbolParam } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const reportRef = useRef(null);
  const [exportBusy, setExportBusy] = useState(false);

  const sym = useMemo(() => sanitizeTickerPageInput(symbolParam || 'AAPL') || 'AAPL', [symbolParam]);

  const yearParam = Number(searchParams.get('year'));
  const monthParam = Number(searchParams.get('month'));
  const latest = useMemo(() => getLatestReportPeriod(sym), [sym]);

  const selectedYear = Number.isFinite(yearParam) && yearParam > 2000 ? yearParam : latest.year;
  const isAnnualPeriod = !isMonthlyReportYear(selectedYear);
  const selectedMonth = isAnnualPeriod
    ? null
    : Number.isFinite(monthParam) && monthParam >= 1 && monthParam <= 12
      ? monthParam
      : latest.month;

  const [expandedYear, setExpandedYear] = useState(
    isMonthlyReportYear(selectedYear) ? selectedYear : null
  );
  const years = useMemo(() => getReportYears(), []);

  useEffect(() => {
    setExpandedYear(isMonthlyReportYear(selectedYear) ? selectedYear : null);
  }, [selectedYear]);

  const report = useMemo(() => {
    if (isAnnualPeriod) return getTickerReport(sym, selectedYear, null);
    return getTickerReport(sym, selectedYear, selectedMonth);
  }, [sym, selectedYear, selectedMonth, isAnnualPeriod]);

  const periodLabel = report?.meta?.periodLabel || `${selectedYear}`;
  const reportKind = report?.meta?.reportKind || (isAnnualPeriod ? 'annual' : 'monthly');

  usePageSeo({
    title:
      reportKind === 'annual'
        ? `${sym} Annual Stock Report — ${selectedYear} | Odin500`
        : `${sym} Monthly Stock Report — ${periodLabel} | Odin500`,
    description:
      reportKind === 'annual'
        ? `${sym} annual performance report for ${selectedYear}: trailing returns, drawdown, relative strength vs S&P 500, and FAQs on Odin500.`
        : `${sym} monthly performance report with trailing returns, drawdown, relative strength vs S&P 500, seasonality, and FAQs on Odin500.`,
    canonicalPath: `/ticker-report/${encodeURIComponent(sym.toLowerCase())}`
  });

  const setPeriod = useCallback(
    (year, month) => {
      const next = new URLSearchParams(searchParams);
      next.set('year', String(year));
      if (isMonthlyReportYear(year) && month) {
        next.set('month', String(month));
      } else {
        next.delete('month');
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const onSymbolChange = useCallback(
    (next) => {
      const s = sanitizeTickerPageInput(next) || 'AAPL';
      const p = getLatestReportPeriod(s);
      navigate(`/ticker-report/${encodeURIComponent(s.toLowerCase())}?year=${p.year}&month=${p.month}`, {
        replace: false
      });
    },
    [navigate]
  );

  const onExportCsv = useCallback(() => {
    if (!report) return;
    downloadTickerReportCsv(report);
  }, [report]);

  const onExportPdf = useCallback(async () => {
    if (!report || !reportRef.current) return;
    setExportBusy(true);
    try {
      await downloadTickerReportPdf(reportRef.current, report);
    } catch (e) {
      console.warn('[TickerReportPage] PDF export failed', e);
    } finally {
      setExportBusy(false);
    }
  }, [report]);

  if (!report) {
    return (
      <div className="ticker-report-page odin-content-page">
        <p className="ticker-report-page__empty">Report data is not available.</p>
      </div>
    );
  }

  const isDemoCopy = !hasExactReport(sym, selectedYear, selectedMonth);

  return (
    <div className="ticker-report-page odin-content-page">
      <div className="ticker-report-page__toolbar">
        <div className="ticker-report-page__symbol-wrap">
          <label className="ticker-report-page__symbol-label" htmlFor="ticker-report-symbol">
            Ticker
          </label>
          <TickerSymbolCombobox
            symbol={sym}
            onSymbolChange={onSymbolChange}
            inputId="ticker-report-symbol"
          />
        </div>
        <div className="ticker-report-page__export-actions">
          <button type="button" className="ticker-report-page__export-btn" onClick={onExportCsv}>
            Download CSV
          </button>
          <button
            type="button"
            className="ticker-report-page__export-btn ticker-report-page__export-btn--primary"
            onClick={onExportPdf}
            disabled={exportBusy}
          >
            {exportBusy ? 'Generating PDF…' : 'Download PDF'}
          </button>
        </div>
      </div>

      {isDemoCopy ? (
        <p className="ticker-report-page__demo-note" role="status">
          Showing sample report layout for {sym} — {periodLabel}. Full symbol-specific reports will be generated from
          live data.
        </p>
      ) : null}

      <div className="ticker-report-page__layout">
        <aside className="ticker-report-page__period-nav" aria-label="Report period">
          <p className="ticker-report-page__period-nav-title">Report archive</p>
          <ul className="ticker-report-page__years">
            {years.map((year) => {
              const months = getMonthsForYear(year);
              const hasMonths = months.length > 0;
              const isExpanded = expandedYear === year;
              const isCurrentSelection = selectedYear === year;
              const annualActive = isCurrentSelection && !isMonthlyReportYear(year);
              return (
                <li key={year} className="ticker-report-page__year-item">
                  <button
                    type="button"
                    className={
                      'ticker-report-page__year-btn' +
                      (isExpanded ? ' is-expanded' : '') +
                      (isCurrentSelection ? ' is-active-year' : '') +
                      (annualActive ? ' is-active' : '')
                    }
                    onClick={() => {
                      if (hasMonths) {
                        setExpandedYear((y) => (y === year ? null : year));
                      } else {
                        setExpandedYear(null);
                        setPeriod(year);
                      }
                    }}
                    aria-expanded={hasMonths ? isExpanded : undefined}
                  >
                    {year}
                    {!hasMonths ? <span className="ticker-report-page__year-tag">Annual</span> : null}
                  </button>
                  {hasMonths && isExpanded ? (
                    <ul className="ticker-report-page__months">
                      {months.map((month) => {
                        const active = selectedYear === year && selectedMonth === month;
                        return (
                          <li key={`${year}-${month}`}>
                            <button
                              type="button"
                              className={'ticker-report-page__month-btn' + (active ? ' is-active' : '')}
                              onClick={() => {
                                setExpandedYear(year);
                                setPeriod(year, month);
                              }}
                            >
                              {formatMonthShort(month)}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </aside>

        <div className="ticker-report-page__main" ref={reportRef}>
          <TickerReportContent report={report} />
        </div>
      </div>
    </div>
  );
}
