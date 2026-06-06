import { useRef } from 'react';
import { getRouteNavigationEpoch, isRouteNavigationStale } from '../navigation/routeNavigationAbort.js';

/**
 * Returns a stale-check function for route-scoped async loaders.
 * Call at effect start: `const stale = useRouteLoadGuard();` then `if (stale(cancelled)) return`.
 */
export function useRouteLoadGuard() {
  const epochRef = useRef(getRouteNavigationEpoch());
  return (cancelled) => isRouteNavigationStale(cancelled, epochRef.current);
}
