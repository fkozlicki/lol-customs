import { AuctionSetupSkeleton } from "@v1/ui/recipes/auctions/auction-setup-skeleton";
import { PageHeader } from "@v1/ui/recipes/page-header";
import { PageShell } from "@v1/ui/recipes/page-shell";
import { getTranslations } from "next-intl/server";
import { NewAuction } from "@/components/auctions/new-auction";
import { QueryBoundary } from "@/components/query-boundary";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

export default async function NewAuctionPage() {
  const t = await getTranslations("dashboard.pages.auctions");
  prefetch(trpc.players.all.queryOptions());
  prefetch(trpc.auctions.listActive.queryOptions());

  return (
    <HydrateClient>
      <PageShell>
        <PageHeader
          eyebrow={t("creator.eyebrow")}
          title={t("creator.title")}
          description={t("creator.description")}
        />
        <QueryBoundary fallback={<AuctionSetupSkeleton />}>
          <NewAuction />
        </QueryBoundary>
      </PageShell>
    </HydrateClient>
  );
}
