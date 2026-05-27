import { useEffect, useMemo, useState } from 'react';
import { MarketReturnsSummaryTable } from '../components/MarketReturnsSummaryTable.jsx';
import { ReturnTableIndexUniverse } from '../components/ReturnTableIndexUniverse.jsx';
import { usePageSeo } from '../seo/usePageSeo.js';
import {
  RETURN_TABLE_INDEX_UNIVERSES,
  allReturnTableRowDefs,
  buildValsFromBatch,
  fetchMarketTickerReturnsBatch,
  returnTableSections,
  uniqueMarketSummaryTickers
} from '../utils/marketReturnsTable.js';

const REFRESH_MS = 5 * 60 * 1000;

export default function ReturnTablePage() {
  usePageSeo({
    title: 'Return Table — Index, Sector & ETF Period Returns | Odin500',
    description:
      'Multi-period return tables for US indices, S&P 500 sectors, index ETFs, S&P 500 / Dow / Nasdaq constituents, and other market series across 1D through 20Y horizons.',
    canonicalPath: '/return-table'
  });

  const sections = useMemo(() => returnTableSections(), []);
  const allDefs = useMemo(() => allReturnTableRowDefs(), []);
  const summaryTickers = useMemo(() => uniqueMarketSummaryTickers(allDefs), [allDefs]);

  const [vals, setVals] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancel = false;
    async function load() {
      if (!summaryTickers.length) return;
      setLoading(true);
      setError('');
      try {
        const payload = await fetchMarketTickerReturnsBatch(summaryTickers, REFRESH_MS);
        if (cancel) return;
        setVals(buildValsFromBatch(payload, allDefs));
      } catch (e) {
        if (!cancel) {
          setError(e.message || 'Failed loading return tables');
          setVals({});
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    }
    load();
    const timer = window.setInterval(load, REFRESH_MS);
    return () => {
      cancel = true;
      window.clearInterval(timer);
    };
  }, [allDefs, summaryTickers]);

  return (
    <div className="return-table-page odin-content-page">
      <header className="return-table-page__head">
        <h1 className="return-table-page__title">Return table</h1>
        <p className="return-table-page__sub">
          Period returns for US indices, sector ETFs, and other market series — same periods as the Markets page summary.
        </p>
        {error && !loading ? (
          <p className="return-table-page__status return-table-page__status--err" role="alert">
            {error}
          </p>
        ) : null}
      </header>

      <div className="return-table-page__sections">
        {sections.map((section) => {
          if (section.subsections?.length) {
            return (
              <div key={section.id} className="return-table-page__group">
                <h2 className="return-table-page__group-title">{section.title}</h2>
                {section.subsections.map((sub) => (
                  <MarketReturnsSummaryTable
                    key={sub.id}
                    title={sub.title}
                    defs={sub.rows}
                    vals={vals}
                    loading={loading}
                  />
                ))}
              </div>
            );
          }
          return (
            <MarketReturnsSummaryTable
              key={section.id}
              title={section.title}
              defs={section.rows}
              vals={vals}
              loading={loading}
              showInfoTip={section.id === 'us'}
            />
          );
        })}

        <div className="return-table-page__group">
          <h2 className="return-table-page__group-title">Index constituents</h2>
          <p className="return-table-page__group-hint">
            Full index membership with period returns — 20 symbols per page.
          </p>
          {RETURN_TABLE_INDEX_UNIVERSES.map((universe) => (
            <ReturnTableIndexUniverse key={universe.id} universe={universe} />
          ))}
        </div>
      </div>
    </div>
  );
}
