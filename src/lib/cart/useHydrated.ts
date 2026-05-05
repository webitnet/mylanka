"use client";

import { useEffect, useState } from "react";

/**
 * Tracks when the zustand persisted store has rehydrated from localStorage.
 * Use to avoid SSR/CSR markup mismatch when rendering store-derived UI.
 */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
