import { PageHeader } from "@v1/ui/recipes/page-header";
import { PageShell } from "@v1/ui/recipes/page-shell";
import { Suspense } from "react";
import RandomTeamsTool, {
  RandomTeamsToolSkeleton,
} from "@/components/random-teams/random-teams-tool";
import { getScopedI18n } from "@/locales/server";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

export default async function ShufflePage() {
  const t = await getScopedI18n("dashboard.pages.shuffle");
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
