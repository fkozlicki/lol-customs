import { ALL_TIME_SEASON } from "@v1/api/season";
import { parsePlayerSlug } from "@v1/domain/riot-id";
import { PageShell } from "@v1/ui/recipes/page-shell";
import { PlayerProfileLayout } from "@v1/ui/recipes/player/player-profile-layout";
import { PlayerProfileSkeleton } from "@v1/ui/recipes/player/player-profile-skeleton";
import { PlayerSeasonEmpty } from "@v1/ui/recipes/player/player-season-empty";
import { PlayerSeasonOverview } from "@v1/ui/recipes/player/player-season-overview";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { MostPlayedChampions } from "@/components/player/most-played-champions";
import { PlayerMatchHistory } from "@/components/player/player-match-history";
import { PlayerProfileHeader } from "@/components/player/player-profile-header";
import { PlayerRelations } from "@/components/player/player-relations";
import { PlayerSeasonSummaries } from "@/components/player/player-season-summaries";
import { PlayerStatsCard } from "@/components/player/player-stats-card";
import { PlayerTitles } from "@/components/player/player-titles";
import { RatingHistoryChart } from "@/components/player/rating-history-chart";
import { QueryBoundary } from "@/components/query-boundary";
import {
  caller,
  getQueryClient,
  HydrateClient,
  prefetch,
  trpc,
} from "@/trpc/server";
import { ALL_TIME_PARAM, SEASON_PARAM, seasonNumber } from "@/utils/season";
import { getSeasonScope } from "@/utils/season-server";

interface PlayerPageProps {
  params: Promise<{ slug: string; locale: string }>;
  searchParams: Promise<{ season?: string }>;
}

export default async function PlayerProfilePage({
  params,
  searchParams,
}: PlayerPageProps) {
  const { slug } = await params;
  const tSeason = await getTranslations("dashboard.season");
  const { season, seasons } = await getSeasonScope((await searchParams).season);
  const riotId = parsePlayerSlug(slug);

  if (!riotId) notFound();

  const { gameName, tagLine } = riotId;
  const player = await caller.players.getByRiotId(riotId);

  if (!player) notFound();

  const puuid = player.puuid;

  const seasonStats = await getQueryClient().fetchQuery(
    trpc.players.profileStats.queryOptions({ puuid, season }),
  );
  const hasSeasonGames = seasonStats != null;
  const seasonLabel =
    season === ALL_TIME_SEASON
      ? tSeason("allTime")
      : tSeason("label", { number: seasonNumber(season, seasons) ?? season });

  prefetch(
    trpc.players.profileStats.queryOptions({ puuid, season: ALL_TIME_SEASON }),
  );
  prefetch(trpc.players.seasonSummaries.queryOptions({ puuid }));
  if (hasSeasonGames) {
    prefetch(trpc.players.ratingHistory.queryOptions({ puuid, season }));
    prefetch(trpc.players.relations.queryOptions({ puuid, season }));
    prefetch(trpc.riftRank.hallOfFame.queryOptions({ season }));
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
  prefetch(trpc.players.soloRank.queryOptions({ puuid }));

  return (
    <HydrateClient>
      <PageShell>
        <QueryBoundary fallback={<PlayerProfileSkeleton />} key={season}>
          <PlayerProfileLayout
            header={
              <PlayerProfileHeader
                puuid={puuid}
                gameName={gameName}
                tagLine={tagLine}
              />
            }
            overview={
              hasSeasonGames ? (
                <PlayerSeasonOverview
                  label={seasonLabel}
                  titles={<PlayerTitles puuid={puuid} season={season} />}
                  stats={<PlayerStatsCard puuid={puuid} season={season} />}
                  chart={
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
                  }
                />
              ) : (
                <PlayerSeasonEmpty
                  seasonNumber={seasonNumber(season, seasons) ?? season}
                  allSeasonsHref={`?${SEASON_PARAM}=${ALL_TIME_PARAM}`}
                />
              )
            }
            sidebar={
              <>
                <PlayerSeasonSummaries
                  puuid={puuid}
                  season={season}
                  seasons={seasons}
                />
                {hasSeasonGames && (
                  <>
                    <MostPlayedChampions puuid={puuid} season={season} />
                    <PlayerRelations puuid={puuid} season={season} />
                  </>
                )}
              </>
            }
            matches={
              hasSeasonGames ? (
                <PlayerMatchHistory puuid={puuid} season={season} />
              ) : null
            }
          />
        </QueryBoundary>
      </PageShell>
    </HydrateClient>
  );
}
