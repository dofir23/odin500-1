import { createContext, useCallback, useContext, useMemo, useRef } from 'react';
import { useProductTour } from '../engagement/useProductTour.js';
import { TOUR_IDS } from '../engagement/tourStorage.js';

const ProductTourContext = createContext(null);

export function ProductTourProvider({ children }) {
  const { startTour, destroyTour } = useProductTour();
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

  const startPaperStrategyCreateTour = useCallback(
    (opts) => startTour(TOUR_IDS.PAPER_STRATEGY_CREATE, opts),
    [startTour]
  );

  const value = useMemo(
    () => ({
      startPaperStrategyManageTour,
      startPaperStrategyCreateTour,
      registerManageTourPrepare,
      destroyTour,
      TOUR_IDS
    }),
    [startPaperStrategyManageTour, startPaperStrategyCreateTour, registerManageTourPrepare, destroyTour]
  );

  return <ProductTourContext.Provider value={value}>{children}</ProductTourContext.Provider>;
}

export function useProductTourContext() {
  const ctx = useContext(ProductTourContext);
  if (!ctx) throw new Error('useProductTourContext must be used within ProductTourProvider');
  return ctx;
}

export function useProductTourOptional() {
  return useContext(ProductTourContext);
}
