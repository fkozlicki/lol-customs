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
    <div className="space-y-6 p-4 max-w-5xl mx-auto w-full">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
      <HydrateClient>
        <Suspense fallback={<RandomTeamsToolSkeleton />}>
          <RandomTeamsTool />
        </Suspense>
      </HydrateClient>
    </div>
  );
}
