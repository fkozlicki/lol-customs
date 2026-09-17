import { ALL_TIME_SEASON } from "@v1/api/season";
import { notFound } from "next/navigation";
import { SectionHeading } from "@/components/page-header";
import { MostPlayedChampions } from "@/components/player/most-played-champions";
import { PlayerMatchHistory } from "@/components/player/player-match-history";
import { PlayerProfileHeader } from "@/components/player/player-profile-header";
import { PlayerRelations } from "@/components/player/player-relations";
import { PlayerSeasonEmpty } from "@/components/player/player-season-empty";
import { PlayerSeasonSummaries } from "@/components/player/player-season-summaries";
import { PlayerStatsCard } from "@/components/player/player-stats-card";
import { RatingHistoryChart } from "@/components/player/rating-history-chart";
import { getScopedI18n } from "@/locales/server";
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
  const t = await getScopedI18n("dashboard.pages.player");
  const tSeason = await getScopedI18n("dashboard.season");
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
      <div className="mx-auto w-full max-w-6xl space-y-10 px-4 pt-10 pb-16 sm:pt-16">
        <PlayerProfileHeader
          puuid={puuid}
          gameName={gameName}
          tagLine={tagLine}
          platformId={platformId}
        />

        {hasSeasonGames ? (
          <div className="space-y-10">
            <div className="space-y-3">
              <p className="label-caps">{seasonLabel}</p>
              <PlayerStatsCard puuid={puuid} season={season} />
            </div>
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
            <PlayerRelations puuid={puuid} season={season} />
          </div>
        ) : (
          <PlayerSeasonEmpty
            seasonNumber={seasonNumber(season, seasons) ?? season}
          />
        )}

        <div className="grid gap-10 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <aside className="space-y-10">
            <PlayerSeasonSummaries
              puuid={puuid}
              season={season}
              seasons={seasons}
            />
            {hasSeasonGames && (
              <MostPlayedChampions puuid={puuid} season={season} />
            )}
          </aside>
          {hasSeasonGames && (
            <section>
              <SectionHeading>{t("matches")}</SectionHeading>
              <PlayerMatchHistory puuid={puuid} season={season} />
            </section>
          )}
        </div>
      </div>
    </HydrateClient>
  );
}
