import { Link } from 'react-router-dom';
import {
  buildHistoricalDataHref,
  buildStatisticHref,
  buildTickerHref,
  buildTickerReportHref
} from '../utils/tickerUrlSync.js';
import { buildRelativePerformanceTickerHref } from '../utils/relativeStrengthNavigation.js';

const STAT_LINKS = [
  { kind: 'ticker-annual', label: 'Annual returns' },
  { kind: 'ticker-quarterly', label: 'Quarterly returns' },
  { kind: 'ticker-monthly', label: 'Monthly returns' },
  { kind: 'ticker-weekly', label: 'Weekly returns' },
  { kind: 'ticker-daily', label: 'Daily returns' }
];

/**
 * Crawlable cross-links between ticker-related routes (same symbol).
 * @param {{ symbol: string, className?: string }} props
 */
export function TickerSeoCrossLinks({ symbol, className = '' }) {
  const sym = String(symbol || '').trim().toUpperCase();
  if (!sym) return null;

  return (
    <nav
      className={'ticker-seo-crosslinks' + (className ? ` ${className}` : '')}
      aria-label={`${sym} related analytics`}
    >
      <p className="ticker-seo-crosslinks__label">Explore {sym}</p>
      <ul className="ticker-seo-crosslinks__list">
        <li>
          <Link to={buildTickerHref(sym)}>Chart &amp; signals</Link>
        </li>
        <li>
          <Link to={buildHistoricalDataHref(sym)}>Historical OHLC</Link>
        </li>
        <li>
          <Link to={buildRelativePerformanceTickerHref(sym)}>Relative performance</Link>
        </li>
        <li>
          <Link to={buildTickerReportHref(sym)}>Investor report</Link>
        </li>
        {STAT_LINKS.map((s) => (
          <li key={s.kind}>
            <Link to={buildStatisticHref(s.kind, sym)}>{s.label}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
