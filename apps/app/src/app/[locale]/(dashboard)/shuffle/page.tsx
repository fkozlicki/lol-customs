import { PageHeader } from "@v1/ui/recipes/page-header";
import { PageShell } from "@v1/ui/recipes/page-shell";
import { RandomTeamsToolSkeleton } from "@v1/ui/recipes/random-teams/random-teams-tool-skeleton";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import RandomTeamsTool from "@/components/random-teams/random-teams-tool";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

export default async function ShufflePage() {
  const t = await getTranslations("dashboard.pages.shuffle");
  prefetch(trpc.players.all.queryOptions());

  return (
    <HydrateClient>
      <PageShell>
        <PageHeader title={t("title")} description={t("description")} />
        <Suspense fallback={<RandomTeamsToolSkeleton />}>
          <RandomTeamsTool />
        </Suspense>
      </PageShell>
    </HydrateClient>
  );
}
