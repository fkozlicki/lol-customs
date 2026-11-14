import { ALL_TIME_SEASON } from "@v1/api/season";
import StandingsSkeleton from "@v1/ui/recipes/home/standings-skeleton";
import { PageShell } from "@v1/ui/recipes/page-shell";
import { getTranslations } from "next-intl/server";
import { replayPoint } from "@/components/home/standings-after-matches";
import StandingsHistoryPicker from "@/components/home/standings-history-picker";
import { TrackStandings } from "@/components/home/track-standings";
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
          fallback={<StandingsSkeleton />}
          key={`${season}:${afterMatches ?? "live"}`}
        >
          <TrackStandings
            season={season}
            seasonTitle={seasonTitle}
            limit={50}
            after={afterMatches}
            historyPicker={<StandingsHistoryPicker matchCount={matchCount} />}
          />
        </QueryBoundary>
      </PageShell>
    </HydrateClient>
  );
}
