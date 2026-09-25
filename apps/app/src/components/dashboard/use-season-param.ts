"use client";

import { parseAsString, useQueryState } from "nuqs";
import { useSyncExternalStore } from "react";
import { SEASON_COOKIE, SEASON_PARAM } from "@/utils/season";

/** Raw `?season=` value (null when the current season is implied). */
export function useSeasonParam() {
  const [season] = useQueryState(SEASON_PARAM, parseAsString);
  return season;
}

/**
 * The season navigation links carry: `?season=`, or the remembered one on pages without it (the forum,
 * auctions). The proxy restores the remembered season on page loads only, so client-side links must
 * carry it themselves.
 */
export function useNavSeason() {
  const season = useSeasonParam();
  const remembered = useSyncExternalStore(
    subscribeToNothing,
    readRememberedSeason,
    () => null,
  );
  return season ?? remembered;
}

// The cookie changes only alongside `?season=`, which re-renders and re-reads it.
function subscribeToNothing() {
  return () => {};
}

function readRememberedSeason() {
  const entry = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${SEASON_COOKIE}=`));
  return entry
    ? decodeURIComponent(entry.slice(SEASON_COOKIE.length + 1))
    : null;
}
