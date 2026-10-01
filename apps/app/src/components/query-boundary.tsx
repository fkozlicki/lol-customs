"use client";

import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

interface QueryBoundaryProps {
  /** Shown while a query below suspends; a skeleton shaped like what it waits for. */
  fallback: React.ReactNode;
  /** Shown when a query below fails; `retry` resets the boundary and reads the query again. */
  errorFallback: (retry: () => void) => React.ReactNode;
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
          fallbackRender={({ resetErrorBoundary }) =>
            errorFallback(resetErrorBoundary)
          }
        >
          <Suspense fallback={fallback}>{children}</Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
