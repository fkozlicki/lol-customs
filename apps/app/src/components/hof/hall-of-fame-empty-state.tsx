"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { ALL_TIME_SEASON, QUALIFICATION_MATCHES } from "@v1/api/season";
import { HallOfFameEmpty } from "@v1/ui/recipes/hof/hall-of-fame-empty";
import { useTRPC } from "@/trpc/react";
import { ALL_TIME_PARAM, SEASON_PARAM } from "@/utils/season";

/**
 * Nobody holds a title on this track yet. On a season's page, point to the season before and to all
 * seasons, which may have titles; the season list is only fetched when it comes to this.
 */
export function HallOfFameEmptyState({ season }: { season: number }) {
  const trpc = useTRPC();
  const { data: seasons } = useSuspenseQuery(trpc.seasons.list.queryOptions());

  if (season === ALL_TIME_SEASON) {
    return <HallOfFameEmpty qualificationMatches={QUALIFICATION_MATCHES} />;
  }

  const index = seasons.findIndex((s) => s.id === season);
  const previous = index > 0 ? seasons[index - 1] : undefined;

  return (
    <HallOfFameEmpty
      qualificationMatches={QUALIFICATION_MATCHES}
      previousSeason={
        previous
          ? {
              seasonNumber: previous.number,
              href: `?${SEASON_PARAM}=${previous.id}`,
            }
          : null
      }
      allSeasonsHref={`?${SEASON_PARAM}=${ALL_TIME_PARAM}`}
    />
  );
}
