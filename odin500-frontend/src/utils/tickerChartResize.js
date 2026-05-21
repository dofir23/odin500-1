/** Inline styles so resizable ticker SVGs override global `.ticker-annual-figma__svg` rules (`height: auto`, `max-height`). */
export function tickerSvgPlotStyle(plotHeight, options = {}) {
  if (plotHeight == null || !Number.isFinite(plotHeight)) return undefined;
  const h = Math.round(plotHeight);
  const fullscreen = Boolean(options.fullscreen);
  return {
    height: fullscreen ? '100%' : h,
    maxHeight: fullscreen ? '100%' : 'none',
    minHeight: fullscreen ? 0 : Math.min(100, h),
    width: '100%',
    maxWidth: '100%',
    flex: fullscreen ? '1 1 auto' : undefined,
    alignSelf: fullscreen ? 'stretch' : undefined,
    display: 'block',
    boxSizing: 'border-box'
  };
}
