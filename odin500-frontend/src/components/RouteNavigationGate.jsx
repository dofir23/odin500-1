import { Suspense, useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { resetRouteNavigationAbort } from '../navigation/routeNavigationAbort.js';
import { PageRouteFallback } from './PageRouteFallback.jsx';

function RouteNavigationFallback() {
  return (
    <div className="route-nav-gate__pending" role="status" aria-live="polite" aria-label="Loading page">
      <PageRouteFallback />
    </div>
  );
}

/**
 * Aborts stale route fetches on navigation and shows loading UI while lazy route chunks load.
 * Uses Suspense (works with BrowserRouter); useNavigation requires a data router.
 */
export function RouteNavigationGate({ children }) {
  const location = useLocation();

  useLayoutEffect(() => {
    resetRouteNavigationAbort();
  }, [location.pathname, location.search, location.key]);

  return (
    <div className="route-nav-gate">
      <Suspense key={location.key} fallback={<RouteNavigationFallback />}>
        {children}
      </Suspense>
    </div>
  );
}
