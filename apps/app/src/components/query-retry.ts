"use client";

import { createContext, useContext } from "react";

/** The retry of the failed `QueryBoundary` around an error fallback; null outside one. */
export const QueryRetryContext = createContext<(() => void) | null>(null);

/** Resets the nearest failed `QueryBoundary` and reads its queries again. */
export function useQueryRetry() {
  const retry = useContext(QueryRetryContext);
  if (!retry) {
    throw new Error(
      "useQueryRetry must be used within a QueryBoundary's errorFallback",
    );
  }
  return retry;
}
