import { ALL_TIME_SEASON } from "@v1/api/season";
import { notFound } from "next/navigation";
import { MostPlayedChampions } from "@/components/player/most-played-champions";
import { PlayerMatchHistory } from "@/components/player/player-match-history";
import { PlayerProfileHeader } from "@/components/player/player-profile-header";
import { PlayerRankCard } from "@/components/player/player-rank-card";
import { PlayerSeasonEmpty } from "@/components/player/player-season-empty";
import { PlayerSeasonSummaries } from "@/components/player/player-season-summaries";
import { PlayerStatsCard } from "@/components/player/player-stats-card";
import { RatingHistoryChart } from "@/components/player/rating-history-chart";
import {
  caller,
  getQueryClient,
  HydrateClient,
  prefetch,
  trpc,
} from "@/trpc/server";
import { seasonNumber } from "@/utils/season";
import { getSeasonScope } from "@/utils/season-server";

interface PlayerPageProps {
  params: Promise<{ slug: string; locale: string }>;
  searchParams: Promise<{ season?: string }>;
}

function parseSlug(slug: string): { gameName: string; tagLine: string } {
  const decoded = decodeURIComponent(slug);
  const lastDash = decoded.lastIndexOf("-");
  if (lastDash === -1) return { gameName: decoded, tagLine: "" };
  return {
    gameName: decoded.slice(0, lastDash),
    tagLine: decoded.slice(lastDash + 1),
  };
}

export default async function PlayerProfilePage({
  params,
  searchParams,
}: PlayerPageProps) {
  const { slug } = await params;
  const { season, seasons } = await getSeasonScope((await searchParams).season);
  const { gameName, tagLine } = parseSlug(slug);

  const player = await caller.players.getByRiotId({ gameName, tagLine });

  if (!player) notFound();

  const puuid = player.puuid;
  const platformId = player.platform_id ?? "eun1";

  const seasonStats = await getQueryClient().fetchQuery(
    trpc.players.profileStats.queryOptions({ puuid, season }),
  );
  const hasSeasonGames = seasonStats != null;

  prefetch(
    trpc.players.profileStats.queryOptions({ puuid, season: ALL_TIME_SEASON }),
  );
  prefetch(trpc.players.seasonSummaries.queryOptions({ puuid }));
  if (hasSeasonGames) {
    prefetch(trpc.players.ratingHistory.queryOptions({ puuid, season }));
    prefetch(
      trpc.players.mostPlayedChampions.queryOptions({
        puuid,
        season,
        limit: 5,
      }),
    );
    prefetch(
      trpc.matches.listByPuuid.infiniteQueryOptions(
        { puuid, season, limit: 10 },
        { getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined },
      ),
    );
  }
  prefetch(
    trpc.riot.getPlayerRankByRiotId.queryOptions({
      gameName,
      tagLine,
      platformId,
    }),
  );
  prefetch(trpc.datadragon.currentPatch.queryOptions());
  prefetch(trpc.datadragon.championMap.queryOptions());

  return (
    <HydrateClient>
      <PlayerProfileHeader
        puuid={puuid}
        gameName={gameName}
        tagLine={tagLine}
      />
      <div className="bg-secondary">
        <div className="flex p-6 gap-2 max-w-6xl mx-auto w-full flex-col xl:flex-row">
          <div className="xl:max-w-[330px] flex flex-col gap-2 flex-1">
            <PlayerRankCard
              gameName={gameName}
              tagLine={tagLine}
              platformId={platformId}
            />

            {hasSeasonGames ? (
              <>
                <PlayerStatsCard puuid={puuid} season={season} />

                <RatingHistoryChart
                  puuid={puuid}
                  season={season}
                  seasonStarts={
                    season === ALL_TIME_SEASON
                      ? seasons.flatMap((s) =>
                          s.starts_at
                            ? [{ number: s.number, startsAt: s.starts_at }]
                            : [],
                        )
                      : []
                  }
                />
              </>
            ) : (
              <PlayerSeasonEmpty
                seasonNumber={seasonNumber(season, seasons) ?? season}
              />
            )}

            <PlayerSeasonSummaries
              puuid={puuid}
              season={season}
              seasons={seasons}
            />

            {hasSeasonGames && (
              <MostPlayedChampions puuid={puuid} season={season} />
            )}
          </div>
          <div className="flex-1">
            {hasSeasonGames && (
              <PlayerMatchHistory puuid={puuid} season={season} />
            )}
          </div>
        </div>
      </div>
    </HydrateClient>
  );
}
