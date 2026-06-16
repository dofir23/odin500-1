import { createContext, useCallback, useContext, useMemo, useRef } from 'react';
import { useProductTour } from '../engagement/useProductTour.js';
import { TOUR_IDS } from '../engagement/tourStorage.js';

const ProductTourContext = createContext(null);

export function ProductTourProvider({ children }) {
  const { startTour } = useProductTour();
  const prepareManageRef = useRef(null);

  const registerManageTourPrepare = useCallback((fn) => {
    prepareManageRef.current = fn;
  }, []);

  const startPaperStrategyManageTour = useCallback(
    (opts) => {
      prepareManageRef.current?.();
      window.setTimeout(() => startTour(TOUR_IDS.PAPER_STRATEGY_MANAGE, opts), 650);
    },
    [startTour]
  );

  const value = useMemo(
    () => ({
      startPaperStrategyManageTour,
      registerManageTourPrepare
    }),
    [startPaperStrategyManageTour, registerManageTourPrepare]
  );

  return <ProductTourContext.Provider value={value}>{children}</ProductTourContext.Provider>;
}

export function useProductTourContext() {
  const ctx = useContext(ProductTourContext);
  if (!ctx) throw new Error('useProductTourContext must be used within ProductTourProvider');
  return ctx;
}
