import { ALL_TIME_SEASON } from "@v1/api/season";
import { Suspense } from "react";
import { maxHistoricallyAfterGames } from "@/components/home/leaderboard-after-games";
import LeaderboardHistoryPicker from "@/components/home/leaderboard-history-picker";
import { Leaderboard } from "@/components/home/leaderboard-preview";
import LeaderboardSkeleton from "@/components/home/leaderboard-skeleton";
import { getScopedI18n } from "@/locales/server";
import { getQueryClient, HydrateClient, prefetch, trpc } from "@/trpc/server";
import { seasonNumber } from "@/utils/season";
import { getSeasonScope } from "@/utils/season-server";

interface DashboardHomePageProps {
  searchParams: Promise<{ after?: string; season?: string }>;
}

export default async function DashboardHomePage({
  searchParams,
}: DashboardHomePageProps) {
  const t = await getScopedI18n("dashboard.season");
  const { after, season: seasonParam } = await searchParams;
  const { season, seasons } = await getSeasonScope(seasonParam);
  const seasonTitle =
    season === ALL_TIME_SEASON
      ? t("allTime")
      : t("label", { number: seasonNumber(season, seasons) ?? season });

  const queryClient = getQueryClient();
  const gamesPlayed = await queryClient.fetchQuery(
    trpc.riftRank.ladderRatedMatchCount.queryOptions({ season }),
  );

  const parsedAfterGames = Number(after);
  const maxAfter = maxHistoricallyAfterGames(gamesPlayed);
  const afterGames =
    typeof after === "string" &&
    after !== "" &&
    Number.isInteger(parsedAfterGames) &&
    parsedAfterGames >= 1 &&
    maxAfter > 0 &&
    parsedAfterGames <= maxAfter
      ? parsedAfterGames
      : undefined;

  void prefetch(
    trpc.riftRank.leaderboard.queryOptions({ season, limit: 50, afterGames }),
  );

  return (
    <HydrateClient>
      <div className="mx-auto w-full max-w-6xl px-4 pt-10 pb-16 sm:pt-16">
        <Suspense
          fallback={<LeaderboardSkeleton />}
          key={`${season}:${afterGames ?? "live"}`}
        >
          <Leaderboard
            season={season}
            seasonTitle={seasonTitle}
            limit={50}
            after={afterGames}
            historyPicker={
              <LeaderboardHistoryPicker gamesPlayed={gamesPlayed} />
            }
          />
        </Suspense>
      </div>
    </HydrateClient>
  );
}
