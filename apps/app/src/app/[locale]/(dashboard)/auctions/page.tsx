import { AuctionListError } from "@v1/ui/recipes/auctions/auction-list-error";
import { AuctionListSkeleton } from "@v1/ui/recipes/auctions/auction-list-skeleton";
import { PageShell } from "@v1/ui/recipes/page-shell";
import { AuctionList } from "@/components/auctions/auction-list";
import { AuctionLive } from "@/components/auctions/auction-live";
import { AuctionsHeader } from "@/components/auctions/auctions-header";
import { QueryBoundary } from "@/components/query-boundary";
import { QueryRetryButton } from "@/components/query-retry-button";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

export default function AuctionsPage() {
  prefetch(trpc.auctions.listActive.queryOptions());

  return (
    <HydrateClient>
      <AuctionLive
        topic="auction:list"
        queryKey={trpc.auctions.listActive.queryKey()}
      >
        <PageShell>
          <AuctionsHeader />
          <QueryBoundary
            fallback={<AuctionListSkeleton />}
            errorFallback={<AuctionListError action={<QueryRetryButton />} />}
          >
            <AuctionList />
          </QueryBoundary>
        </PageShell>
      </AuctionLive>
    </HydrateClient>
  );
}
