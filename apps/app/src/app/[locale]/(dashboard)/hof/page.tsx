import { Suspense } from "react";
import { HofGrid, HofGridSkeleton } from "@/components/hof/hof-grid";
import { getScopedI18n } from "@/locales/server";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { getSeasonScope } from "@/utils/season-server";

interface HallOfFamePageProps {
  searchParams: Promise<{ season?: string }>;
}

export default async function HallOfFamePage({
  searchParams,
}: HallOfFamePageProps) {
  const t = await getScopedI18n("dashboard.pages.hallOfFame");
  const { season } = await getSeasonScope((await searchParams).season);
  prefetch(trpc.riftRank.hofLeaders.queryOptions({ season }));

  return (
    <div className="space-y-6 p-4 max-w-3xl mx-auto w-full">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
      <HydrateClient>
        <Suspense fallback={<HofGridSkeleton />} key={season}>
          <HofGrid season={season} />
        </Suspense>
      </HydrateClient>
    </div>
  );
}
