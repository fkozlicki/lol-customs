"use client";

import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { QueryError } from "@v1/ui/recipes/query-error";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { QueryRetryContext } from "./query-retry";
import { QueryRetryButton } from "./query-retry-button";

interface QueryBoundaryProps {
  /** Shown while a query below suspends; a skeleton shaped like what it waits for. */
  fallback: React.ReactNode;
  /**
   * Shown when a query below fails; by default `QueryError` with a retry. An element, so a server
   * page can pass it; whatever retries reads `useQueryRetry` (`QueryRetryButton`).
   */
  errorFallback?: React.ReactNode;
  children: React.ReactNode;
}

/** The loading and the failure of the suspending queries below it, in one boundary. */
export function QueryBoundary({
  fallback,
  errorFallback = <QueryError action={<QueryRetryButton />} />,
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
