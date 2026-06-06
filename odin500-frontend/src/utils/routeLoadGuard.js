import { startTransition } from 'react';
import {
  getRouteNavigationAbortSignal,
  isAbortError
} from '../navigation/routeNavigationAbort.js';

/** True when the route loader should stop (unmounted or user navigated away). */
export function shouldApplyRouteLoad(cancelled = false) {
  return !cancelled && !getRouteNavigationAbortSignal().aborted;
}

/**
 * Apply state updates from async route loaders without blocking urgent navigation renders.
 * @param {boolean} cancelled local effect cancelled flag
 * @param {() => void} fn
 */
export function applyRouteLoadUpdate(cancelled, fn) {
  if (!shouldApplyRouteLoad(cancelled)) return;
  startTransition(() => {
    if (!shouldApplyRouteLoad(cancelled)) return;
    fn();
  });
}

export function isRouteLoadAbortError(err) {
  return isAbortError(err);
}
