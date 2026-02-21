import { Suspense } from "react";
import { HofGrid, HofGridSkeleton } from "@/components/hof/hof-grid";
import { getScopedI18n } from "@/locales/server";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

export default async function HallOfFamePage() {
  const t = await getScopedI18n("dashboard.pages.hallOfFame");
  prefetch(trpc.riftRank.hofLeaders.queryOptions());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
      <HydrateClient>
        <Suspense fallback={<HofGridSkeleton />}>
          <HofGrid />
        </Suspense>
      </HydrateClient>
    </div>
  );
}
