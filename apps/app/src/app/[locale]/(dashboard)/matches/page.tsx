import { Card, CardContent, CardHeader } from "@v1/ui/card";
import { Skeleton } from "@v1/ui/skeleton";
import { Suspense } from "react";
import { MatchHistoryList } from "@/components/matches/match-history-list";
import { getScopedI18n } from "@/locales/server";
import { getQueryClient, HydrateClient, trpc } from "@/trpc/server";

function MatchHistorySkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <li key={i} className="flex justify-between gap-4 py-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-16" />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
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
      <div className="space-y-6">
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
