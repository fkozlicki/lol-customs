"use client";

import { parseAsString, useQueryState } from "nuqs";
import { SEASON_PARAM } from "@/utils/season";

/** Raw `?season=` value (null when the current season is implied). */
export function useSeasonParam() {
  const [season] = useQueryState(SEASON_PARAM, parseAsString);
  return season;
}
