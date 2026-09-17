import { ALL_TIME_SEASON } from "@v1/api/season";
import { Suspense } from "react";
import { DownloadAppButton } from "@/components/dashboard/download-app-button";
import { MatchHistoryList } from "@/components/matches/match-history-list";
import MatchHistorySkeleton from "@/components/matches/match-history-skeleton";
import { PageHeader } from "@/components/page-header";
import { getScopedI18n } from "@/locales/server";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { seasonNumber } from "@/utils/season";
import { getSeasonScope } from "@/utils/season-server";

interface MatchHistoryPageProps {
  searchParams: Promise<{ season?: string }>;
}

export default async function MatchHistoryPage({
  searchParams,
}: MatchHistoryPageProps) {
  const t = await getScopedI18n("dashboard.pages.matchHistory");
  const tSeason = await getScopedI18n("dashboard.season");
  const { season, seasons } = await getSeasonScope((await searchParams).season);
  prefetch(
    trpc.matches.list.infiniteQueryOptions(
      { season, limit: 10 },
      { getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined },
    ),
  );
  prefetch(trpc.datadragon.currentPatch.queryOptions());
  prefetch(trpc.datadragon.championMap.queryOptions());

  return (
    <HydrateClient>
      <div className="mx-auto w-full max-w-5xl space-y-6 px-4 pt-10 pb-16 sm:pt-16">
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
        <Suspense fallback={<MatchHistorySkeleton />} key={season}>
          <MatchHistoryList season={season} />
        </Suspense>
      </div>
    </HydrateClient>
  );
}
