import { DrawSkeleton } from "@v1/ui/recipes/draw/draw-skeleton";
import { PageHeader } from "@v1/ui/recipes/page-header";
import { PageShell } from "@v1/ui/recipes/page-shell";
import { getTranslations } from "next-intl/server";
import { DrawTool } from "@/components/draw/draw-tool";
import { QueryBoundary } from "@/components/query-boundary";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

export default async function ShufflePage() {
  const t = await getTranslations("dashboard.pages.shuffle");
  prefetch(trpc.players.all.queryOptions());

  return (
    <HydrateClient>
      <PageShell>
        <PageHeader title={t("title")} description={t("description")} />
        <QueryBoundary fallback={<DrawSkeleton />}>
          <DrawTool />
        </QueryBoundary>
      </PageShell>
    </HydrateClient>
  );
}
