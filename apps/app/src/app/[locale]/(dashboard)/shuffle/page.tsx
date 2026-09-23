import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
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
      <div className="mx-auto w-full max-w-6xl space-y-10 px-4 pt-10 pb-16 sm:pt-16">
        <PageHeader title={t("title")} description={t("description")} />
        <Suspense fallback={<RandomTeamsToolSkeleton />}>
          <RandomTeamsTool />
        </Suspense>
      </div>
    </HydrateClient>
  );
}
