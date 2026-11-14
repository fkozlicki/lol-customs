import { ALL_TIME_SEASON } from "@v1/api/season";
import LeaderboardSkeleton from "@v1/ui/recipes/home/leaderboard-skeleton";
import { PageShell } from "@v1/ui/recipes/page-shell";
import { getTranslations } from "next-intl/server";
import LeaderboardHistoryPicker from "@/components/home/leaderboard-history-picker";
import { Leaderboard } from "@/components/home/leaderboard-preview";
import { replayPoint } from "@/components/home/standings-after-matches";
import { QueryBoundary } from "@/components/query-boundary";
import { getQueryClient, HydrateClient, prefetch, trpc } from "@/trpc/server";
import { seasonNumber } from "@/utils/season";
import { getSeasonScope } from "@/utils/season-server";

interface DashboardHomePageProps {
  searchParams: Promise<{ after?: string; season?: string }>;
}

export default async function DashboardHomePage({
  searchParams,
}: DashboardHomePageProps) {
  const t = await getTranslations("dashboard.season");
  const { after, season: seasonParam } = await searchParams;
  const { season, seasons } = await getSeasonScope(seasonParam);
  const seasonTitle =
    season === ALL_TIME_SEASON
      ? t("allTime")
      : t("label", { number: seasonNumber(season, seasons) ?? season });

  const queryClient = getQueryClient();
  const matchCount = await queryClient.fetchQuery(
    trpc.matches.count.queryOptions({ season }),
  );

  const afterMatches = replayPoint(after, matchCount);

  void prefetch(
    trpc.standings.get.queryOptions({ season, limit: 50, afterMatches }),
  );

  return (
    <HydrateClient>
      <PageShell gap="none">
        {/* TODO: rows should reorder smoothly when the season changes. Keying the boundary remounts
            the standings, so they replay the entry stagger instead; animating a reorder needs the
            previous rows kept (e.g. placeholder data) and `layout` on each row. */}
        <QueryBoundary
          fallback={<LeaderboardSkeleton />}
          key={`${season}:${afterMatches ?? "live"}`}
        >
          <Leaderboard
            season={season}
            seasonTitle={seasonTitle}
            limit={50}
            after={afterMatches}
            historyPicker={<LeaderboardHistoryPicker matchCount={matchCount} />}
          />
        </QueryBoundary>
      </PageShell>
    </HydrateClient>
  );
}
