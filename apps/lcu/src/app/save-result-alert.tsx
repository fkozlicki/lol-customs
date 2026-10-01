"use client";

import { Alert, AlertDescription, AlertTitle } from "@v1/ui/alert";
import type { SaveResult } from "./games";

/** The errors a failed save lists before it sums up the rest. */
const ERRORS_SHOWN = 5;

/** What the last fetch or save did: how many matches it saved, or what went wrong. */
export function SaveResultAlert({ result }: { result: SaveResult }) {
  if (result.type === "success") {
    return (
      <Alert className="mt-4 border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400">
        <AlertTitle>{result.message}</AlertTitle>
        {result.saved > 0 && (
          <AlertDescription>
            {result.saved} match{result.saved === 1 ? "" : "es"} saved.
          </AlertDescription>
        )}
      </Alert>
    );
  }

  if (result.type === "error") {
    return (
      <Alert variant="destructive" className="mt-4">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {result.message}
          {result.errors && result.errors.length > 0 && (
            <ul className="mt-2 list-inside list-disc text-xs">
              {result.errors.slice(0, ERRORS_SHOWN).map((error, i) => (
                <li key={i}>{error}</li>
              ))}
              {result.errors.length > ERRORS_SHOWN && (
                <li>…and {result.errors.length - ERRORS_SHOWN} more</li>
              )}
            </ul>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
