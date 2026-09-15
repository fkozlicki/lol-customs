import { Suspense } from "react";
import { MatchHistoryList } from "@/components/matches/match-history-list";
import MatchHistorySkeleton from "@/components/matches/match-history-skeleton";
import { getScopedI18n } from "@/locales/server";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { getSeasonScope } from "@/utils/season-server";

interface MatchHistoryPageProps {
  searchParams: Promise<{ season?: string }>;
}

export default async function MatchHistoryPage({
  searchParams,
}: MatchHistoryPageProps) {
  const t = await getScopedI18n("dashboard.pages.matchHistory");
  const { season } = await getSeasonScope((await searchParams).season);
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
      <div className="space-y-6 p-4 max-w-3xl mx-auto w-full">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground text-sm">{t("description")}</p>
        </div>
        <Suspense fallback={<MatchHistorySkeleton />} key={season}>
          <MatchHistoryList season={season} />
        </Suspense>
      </div>
    </HydrateClient>
  );
}
