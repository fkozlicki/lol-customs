import { ALL_TIME_SEASON } from "@v1/api/season";
import { HallOfFameSkeleton } from "@v1/ui/recipes/hof/hall-of-fame-skeleton";
import { PageHeader } from "@v1/ui/recipes/page-header";
import { PageShell } from "@v1/ui/recipes/page-shell";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { HallOfFame } from "@/components/hof/hall-of-fame";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { seasonNumber } from "@/utils/season";
import { getSeasonScope } from "@/utils/season-server";

interface HallOfFamePageProps {
  searchParams: Promise<{ season?: string }>;
}

export default async function HallOfFamePage({
  searchParams,
}: HallOfFamePageProps) {
  const t = await getTranslations("dashboard.pages.hallOfFame");
  const tSeason = await getTranslations("dashboard.season");
  const { season, seasons } = await getSeasonScope((await searchParams).season);
  prefetch(trpc.riftRank.hallOfFame.queryOptions({ season }));

  return (
    <HydrateClient>
      <PageShell>
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
      </PageShell>
    </HydrateClient>
  );
}
