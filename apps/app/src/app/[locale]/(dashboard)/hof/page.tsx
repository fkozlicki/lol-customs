import { ALL_TIME_SEASON } from "@v1/api/season";
import { Suspense } from "react";
import { HallOfFame, HallOfFameSkeleton } from "@/components/hof/hall-of-fame";
import { PageHeader } from "@/components/page-header";
import { getScopedI18n } from "@/locales/server";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { seasonNumber } from "@/utils/season";
import { getSeasonScope } from "@/utils/season-server";

interface HallOfFamePageProps {
  searchParams: Promise<{ season?: string }>;
}

export default async function HallOfFamePage({
  searchParams,
}: HallOfFamePageProps) {
  const t = await getScopedI18n("dashboard.pages.hallOfFame");
  const tSeason = await getScopedI18n("dashboard.season");
  const { season, seasons } = await getSeasonScope((await searchParams).season);
  prefetch(trpc.riftRank.hallOfFame.queryOptions({ season }));

  return (
    <HydrateClient>
      <div className="mx-auto w-full max-w-6xl space-y-10 px-4 pt-10 pb-16 sm:pt-16">
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
        />
        <Suspense fallback={<HallOfFameSkeleton />} key={season}>
          <HallOfFame season={season} />
        </Suspense>
      </div>
    </HydrateClient>
  );
}
