import { Suspense } from "react";
import { maxHistoricallyAfterGames } from "@/components/home/leaderboard-after-games";
import LeaderboardHistoryPicker from "@/components/home/leaderboard-history-picker";
import { Leaderboard } from "@/components/home/leaderboard-preview";
import LeaderboardSkeleton from "@/components/home/leaderboard-skeleton";
import { getScopedI18n } from "@/locales/server";
import { getQueryClient, HydrateClient, prefetch, trpc } from "@/trpc/server";

interface DashboardHomePageProps {
  searchParams: Promise<{ after?: string }>;
}

export default async function DashboardHomePage({
  searchParams,
}: DashboardHomePageProps) {
  const t = await getScopedI18n("dashboard.pages.leaderboard");
  const { after } = await searchParams;

  const queryClient = getQueryClient();
  const gamesPlayed = await queryClient.fetchQuery(
    trpc.riftRank.ladderRatedMatchCount.queryOptions(),
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
    trpc.riftRank.leaderboard.queryOptions({ limit: 50, afterGames }),
  );

  return (
    <HydrateClient>
      <div className="space-y-6 p-4 max-w-4xl mx-auto w-full">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground text-sm">{t("description")}</p>
        </div>
        <LeaderboardHistoryPicker gamesPlayed={gamesPlayed} />
        <Suspense fallback={<LeaderboardSkeleton />} key={afterGames}>
          <Leaderboard limit={50} after={afterGames} />
        </Suspense>
      </div>
    </HydrateClient>
  );
}
