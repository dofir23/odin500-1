import React, { createContext, useContext } from 'react';

/** @typedef {{ historicalDataPreview?: object | null }} SsrPageData */

const SsrPageDataContext = createContext(/** @type {SsrPageData | null} */ (null));

export function SsrPageDataProvider({ value = null, children }) {
  return <SsrPageDataContext.Provider value={value}>{children}</SsrPageDataContext.Provider>;
}

export function useSsrPageData() {
  return useContext(SsrPageDataContext);
}
