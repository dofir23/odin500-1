export function getDocumentTheme() {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

export function subscribeDocumentTheme(callback) {
  if (typeof document === 'undefined') return () => {};
  const obs = new MutationObserver(() => callback());
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => obs.disconnect();
}
