/** SSR-safe stub — real charts mount client-side in useEffect. */
export const CrosshairMode = { Normal: 0, Magnet: 1 };
export const PriceScaleMode = { Normal: 0, Logarithmic: 1, Percentage: 2, IndexedTo100: 3 };

export function createChart() {
  const series = {
    setData() {},
    setMarkers() {},
    applyOptions() {}
  };
  return {
    remove() {},
    applyOptions() {},
    timeScale() {
      return { fitContent() {} };
    },
    addCandlestickSeries() {
      return series;
    },
    addLineSeries() {
      return series;
    },
    addHistogramSeries() {
      return series;
    }
  };
}
