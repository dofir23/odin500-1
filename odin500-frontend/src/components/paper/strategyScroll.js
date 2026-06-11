export function scrollToStrategyAnchor(anchor) {
  window.requestAnimationFrame(() => {
    const el = document.querySelector(`[data-strategy-anchor="${anchor}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
}
