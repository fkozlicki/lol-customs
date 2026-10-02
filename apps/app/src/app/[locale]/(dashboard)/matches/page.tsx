import { ALL_TIME_SEASON } from "@v1/api/season";
import MatchHistorySkeleton from "@v1/ui/recipes/matches/match-history-skeleton";
import { PageHeader } from "@v1/ui/recipes/page-header";
import { PageShell } from "@v1/ui/recipes/page-shell";
import { getTranslations } from "next-intl/server";
import { DownloadAppButton } from "@/components/dashboard/download-app-button";
import { MatchHistoryList } from "@/components/matches/match-history-list";
import { QueryBoundary } from "@/components/query-boundary";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { seasonNumber } from "@/utils/season";
import { getSeasonScope } from "@/utils/season-server";

interface MatchHistoryPageProps {
  searchParams: Promise<{ season?: string }>;
}

export default async function MatchHistoryPage({
  searchParams,
}: MatchHistoryPageProps) {
  const t = await getTranslations("dashboard.pages.matchHistory");
  const tSeason = await getTranslations("dashboard.season");
  const { season, seasons } = await getSeasonScope((await searchParams).season);
  prefetch(
    trpc.matches.list.infiniteQueryOptions(
      { season, limit: 10 },
      { getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined },
    ),
  );

  return (
    <HydrateClient>
      <PageShell>
        <PageHeader
          eyebrow={
            season === ALL_TIME_SEASON
              ? tSeason("allTime")
              : tSeason("label", {
                  number: seasonNumber(season, seasons) ?? season,
                })
          }
          title={t("title")}
          description={t("description")}
        >
          <DownloadAppButton />
        </PageHeader>
        <QueryBoundary fallback={<MatchHistorySkeleton />} key={season}>
          <MatchHistoryList season={season} />
        </QueryBoundary>
      </PageShell>
    </HydrateClient>
  );
}
