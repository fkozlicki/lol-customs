import { PageShell } from "@v1/ui/recipes/page-shell";
import { AuctionList } from "@/components/auctions/auction-list";
import { AuctionLive } from "@/components/auctions/auction-live";
import { AuctionsHeader } from "@/components/auctions/auctions-header";
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
          <AuctionList />
        </PageShell>
      </AuctionLive>
    </HydrateClient>
  );
}
