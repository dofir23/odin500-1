/** Aborts in-flight API calls when the user navigates to another route. */

let routeAbortController = new AbortController();

export function resetRouteNavigationAbort() {
  routeAbortController.abort();
  routeAbortController = new AbortController();
}

export function getRouteNavigationAbortSignal() {
  return routeAbortController.signal;
}

export function isAbortError(err) {
  if (!err) return false;
  if (err.name === 'AbortError') return true;
  return err instanceof DOMException && err.name === 'AbortError';
}

/**
 * @param {AbortSignal | null | undefined} extra
 * @returns {AbortSignal}
 */
export function composeAbortSignals(...extras) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  for (const sig of extras) {
    if (!sig) continue;
    if (sig.aborted) {
      controller.abort();
      return controller.signal;
    }
    sig.addEventListener('abort', abort, { once: true });
  }
  return controller.signal;
}
