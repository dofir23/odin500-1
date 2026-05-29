/** SSR-safe stub — real charts mount client-side in useEffect. */
export const CrosshairMode = { Normal: 0, Magnet: 1 };
export const PriceScaleMode = { Normal: 0, Logarithmic: 1, Percentage: 2, IndexedTo100: 3 };
export const LineStyle = { Solid: 0, Dotted: 1, Dashed: 2, LargeDashed: 3, SparseDotted: 4 };

export function createChart() {
  const series = {
    setData() {},
    setMarkers() {},
    applyOptions() {},
    createPriceLine() {},
    priceToCoordinate() {
      return null;
    },
    priceScale() {
      return { applyOptions() {} };
    }
  };
  return {
    remove() {},
    applyOptions() {},
    timeScale() {
      return {
        fitContent() {},
        timeToCoordinate() {
          return null;
        },
        subscribeVisibleLogicalRangeChange() {
          return () => {};
        },
        subscribeVisibleTimeRangeChange() {
          return () => {};
        },
        unsubscribeVisibleLogicalRangeChange() {},
        unsubscribeVisibleTimeRangeChange() {}
      };
    },
    subscribeCrosshairMove() {
      return () => {};
    },
    addCandlestickSeries() {
      return series;
    },
    addLineSeries() {
      return series;
    },
    addAreaSeries() {
      return series;
    },
    addBaselineSeries() {
      return series;
    },
    addHistogramSeries() {
      return series;
    }
  };
}
