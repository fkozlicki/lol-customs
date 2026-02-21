import { Suspense } from "react";
import { SquadGrid, SquadGridSkeleton } from "@/components/squad/squad-grid";
import { getScopedI18n } from "@/locales/server";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

export default async function SquadPage() {
  const t = await getScopedI18n("dashboard.pages.duos");
  prefetch(trpc.duos.duosPerPlayer.queryOptions());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
      <HydrateClient>
        <Suspense fallback={<SquadGridSkeleton />}>
          <SquadGrid />
        </Suspense>
      </HydrateClient>
    </div>
  );
}
