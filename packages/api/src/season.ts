import { z } from "zod";

/**
 * Rating track a query is scoped to: a ladder season id, or `ALL_TIME_SEASON`
 * for the continuous all-time track (every season combined, no rating resets).
 */
export const ALL_TIME_SEASON = 0;

export const seasonInput = z.number().int().min(ALL_TIME_SEASON);

export function isAllTime(season: number): boolean {
  return season === ALL_TIME_SEASON;
}
