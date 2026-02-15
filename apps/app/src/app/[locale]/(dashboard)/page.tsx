import { Card, CardContent, CardHeader } from "@v1/ui/card";
import { Skeleton } from "@v1/ui/skeleton";
import { Suspense } from "react";
import { Leaderboard } from "@/components/home/ladder-preview";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

function LeaderboardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-6 w-28" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardHomePage() {
  prefetch(trpc.ladder.leaderboard.queryOptions({ limit: 50 }));

  return (
    <HydrateClient>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leaderboard</h1>
          <p className="text-muted-foreground text-sm">
            Player ratings and standings.
          </p>
        </div>
        <Suspense fallback={<LeaderboardSkeleton />}>
          <Leaderboard limit={50} />
        </Suspense>
      </div>
    </HydrateClient>
  );
}
