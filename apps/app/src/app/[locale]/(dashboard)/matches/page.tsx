import { Suspense } from "react";
import MatchCardSkeleton from "@/components/matches/match-card-skeleton";
import { MatchHistoryList } from "@/components/matches/match-history-list";
import { getScopedI18n } from "@/locales/server";
import { getQueryClient, HydrateClient, trpc } from "@/trpc/server";

function MatchHistorySkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 10 }).map((_, i) => (
        <MatchCardSkeleton key={i} className="bg-secondary/50" />
      ))}
    </div>
  );
}

export default async function MatchHistoryPage() {
  const t = await getScopedI18n("dashboard.pages.matchHistory");
  const queryClient = getQueryClient();
  await Promise.all([
    queryClient.prefetchInfiniteQuery(
      trpc.matches.list.infiniteQueryOptions(
        { limit: 20 },
        { getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined },
      ),
    ),
    queryClient.fetchQuery(trpc.datadragon.currentPatch.queryOptions()),
    queryClient.fetchQuery(trpc.datadragon.championMap.queryOptions()),
  ]);

  return (
    <HydrateClient>
      <div className="space-y-6 p-4 max-w-3xl mx-auto w-full">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground text-sm">{t("description")}</p>
        </div>
        <Suspense fallback={<MatchHistorySkeleton />}>
          <MatchHistoryList />
        </Suspense>
      </div>
    </HydrateClient>
  );
}
