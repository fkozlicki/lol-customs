"use client";

import { useQuery } from "@tanstack/react-query";
import { ALL_TIME_SEASON } from "@v1/api/season";
import { SeasonSelector as SeasonSelectorView } from "@v1/ui/recipes/dashboard/season-selector";
import { usePathname } from "next/navigation";
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import { useTRPC } from "@/trpc/react";
import {
  isSeasonScopedPath,
  resolveSeason,
  SEASON_COOKIE,
  SEASON_PARAM,
  seasonToParam,
} from "@/utils/season";

/**
 * The season in `?season=`, on the pages that are season-scoped. Picking one also drops a replay
 * point (`?after=`) and remembers the choice for the next visit.
 */
export function SeasonSelector() {
  const trpc = useTRPC();
  const pathname = usePathname();
  const { data: seasons } = useQuery(trpc.seasons.list.queryOptions());
  const [params, setParams] = useQueryStates(
    { [SEASON_PARAM]: parseAsString, after: parseAsInteger },
    { shallow: false },
  );

  if (!seasons?.length || !isSeasonScopedPath(pathname)) return null;

  const season = resolveSeason(params[SEASON_PARAM], seasons);

  return (
    <SeasonSelectorView
      seasons={seasons.map((s) => ({
        value: seasonToParam(s.id),
        seasonNumber: s.number,
        isCurrent: s.isCurrent,
      }))}
      allSeasonsValue={seasonToParam(ALL_TIME_SEASON)}
      value={seasonToParam(season)}
      onChange={(value) => {
        rememberSeason(
          value,
          seasons.find((s) => s.isCurrent)?.id === Number(value),
        );
        setParams({ [SEASON_PARAM]: value, after: null });
      }}
    />
  );
}

/** Picking the current season forgets the choice, so a new season shows up once it starts. */
function rememberSeason(value: string, isCurrent: boolean) {
  const maxAge = isCurrent ? 0 : 60 * 60 * 24 * 365;
  document.cookie = `${SEASON_COOKIE}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; samesite=lax`;
}
