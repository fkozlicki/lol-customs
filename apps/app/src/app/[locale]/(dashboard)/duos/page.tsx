import { Suspense } from "react";
import { SquadGrid, SquadGridSkeleton } from "@/components/squad/squad-grid";
import { getScopedI18n } from "@/locales/server";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { getSeasonScope } from "@/utils/season-server";

interface SquadPageProps {
  searchParams: Promise<{ season?: string }>;
}

export default async function SquadPage({ searchParams }: SquadPageProps) {
  const t = await getScopedI18n("dashboard.pages.duos");
  const { season } = await getSeasonScope((await searchParams).season);
  prefetch(trpc.duos.duosPerPlayer.queryOptions({ season, partnerLimit: 3 }));

  return (
    <div className="space-y-6 p-4 max-w-3xl mx-auto w-full">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
      <HydrateClient>
        <Suspense fallback={<SquadGridSkeleton />} key={season}>
          <SquadGrid season={season} />
        </Suspense>
      </HydrateClient>
    </div>
  );
}
