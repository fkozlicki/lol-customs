import { Suspense } from "react";
import { Leaderboard } from "@/components/home/leaderboard-preview";
import LeaderboardSkeleton from "@/components/home/leaderboard-skeleton";
import { getScopedI18n } from "@/locales/server";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

export default async function DashboardHomePage() {
  const t = await getScopedI18n("dashboard.pages.leaderboard");
  prefetch(trpc.riftRank.leaderboard.queryOptions({ limit: 50 }));

  return (
    <HydrateClient>
      <div className="space-y-6 p-4 max-w-3xl mx-auto w-full">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground text-sm">{t("description")}</p>
        </div>
        <Suspense fallback={<LeaderboardSkeleton />}>
          <Leaderboard limit={50} />
        </Suspense>
      </div>
    </HydrateClient>
  );
}
