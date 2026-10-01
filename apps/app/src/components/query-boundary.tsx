"use client";

import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { createContext, Suspense, useContext } from "react";
import { ErrorBoundary } from "react-error-boundary";

const QueryRetryContext = createContext<(() => void) | null>(null);

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

interface QueryBoundaryProps {
  /** Shown while a query below suspends; a skeleton shaped like what it waits for. */
  fallback: React.ReactNode;
  /**
   * Shown when a query below fails. An element, so a server page can pass it; whatever retries reads
   * `useQueryRetry` (`QueryRetryButton`).
   */
  errorFallback: React.ReactNode;
  children: React.ReactNode;
}

/** The loading and the failure of the suspending queries below it, in one boundary. */
export function QueryBoundary({
  fallback,
  errorFallback,
  children,
}: QueryBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          fallbackRender={({ resetErrorBoundary }) => (
            <QueryRetryContext.Provider value={resetErrorBoundary}>
              {errorFallback}
            </QueryRetryContext.Provider>
          )}
        >
          <Suspense fallback={fallback}>{children}</Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
