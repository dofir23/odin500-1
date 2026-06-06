/** Aborts in-flight API calls when the user navigates to another route. */

let routeAbortController = new AbortController();
let routeNavigationEpoch = 0;

export function resetRouteNavigationAbort() {
  routeAbortController.abort(new DOMException('Route navigation changed', 'AbortError'));
  routeAbortController = new AbortController();
  routeNavigationEpoch += 1;
}

export function getRouteNavigationAbortSignal() {
  return routeAbortController.signal;
}

export function getRouteNavigationEpoch() {
  return routeNavigationEpoch;
}

export function isAbortError(err) {
  if (!err) return false;
  if (err.name === 'AbortError') return true;
  return err instanceof DOMException && err.name === 'AbortError';
}

/**
 * True when a route-scoped loader should stop (unmounted or user navigated away).
 * @param {boolean} cancelled effect cleanup flag
 * @param {number} epochAtStart value from getRouteNavigationEpoch() when the effect started
 */
export function isRouteNavigationStale(cancelled, epochAtStart) {
  return cancelled || getRouteNavigationEpoch() !== epochAtStart;
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

/** Yield the main thread so route changes can paint before heavy sync work. */
export function yieldToMain() {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(() => resolve(), { timeout: 32 });
      return;
    }
    setTimeout(resolve, 0);
  });
}

function isInternalAppHref(href) {
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
    return false;
  }
  try {
    const url = new URL(href, window.location.origin);
    return url.origin === window.location.origin;
  } catch {
    return false;
  }
}

/**
 * Abort stale route work as soon as the user clicks an in-app link (capture phase).
 * @returns {() => void} cleanup
 */
export function installInternalLinkNavigationAbort() {
  if (typeof document === 'undefined') return () => {};

  const onClick = (event) => {
    if (event.defaultPrevented) return;
    if (event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const target = event.target;
    if (!(target instanceof Element)) return;
    const anchor = target.closest('a[href]');
    if (!anchor) return;
    if (anchor.target === '_blank' || anchor.hasAttribute('download')) return;

    const href = anchor.getAttribute('href');
    if (!isInternalAppHref(href)) return;

    const next = new URL(href, window.location.origin);
    const cur = window.location;
    if (next.pathname === cur.pathname && next.search === cur.search && next.hash === cur.hash) {
      return;
    }

    resetRouteNavigationAbort();
  };

  document.addEventListener('click', onClick, true);
  return () => document.removeEventListener('click', onClick, true);
}

function historyUrlChanged(nextUrl) {
  if (nextUrl == null || nextUrl === '') return false;
  try {
    const next = new URL(String(nextUrl), window.location.origin);
    const cur = window.location;
    return next.pathname !== cur.pathname || next.search !== cur.search;
  } catch {
    return true;
  }
}

/** Abort when React Router (or other code) changes history without a link click. */
export function installHistoryNavigationAbort() {
  if (typeof window === 'undefined') return () => {};

  const { pushState, replaceState } = history;
  history.pushState = function (...args) {
    if (historyUrlChanged(args[2])) resetRouteNavigationAbort();
    return pushState.apply(this, args);
  };
  history.replaceState = function (...args) {
    if (historyUrlChanged(args[2])) resetRouteNavigationAbort();
    return replaceState.apply(this, args);
  };
  const onPopState = () => resetRouteNavigationAbort();
  window.addEventListener('popstate', onPopState);

  return () => {
    history.pushState = pushState;
    history.replaceState = replaceState;
    window.removeEventListener('popstate', onPopState);
  };
}
