import { AuctionRoomSkeleton } from "@v1/ui/recipes/auctions/auction-room-skeleton";
import { PageShell } from "@v1/ui/recipes/page-shell";
import { notFound } from "next/navigation";
import { AuctionLive } from "@/components/auctions/auction-live";
import { AuctionRoom } from "@/components/auctions/auction-room";
import { QueryBoundary } from "@/components/query-boundary";
import { getQueryClient, HydrateClient, trpc } from "@/trpc/server";

export default async function AuctionRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const queryClient = getQueryClient();
  const roomQuery = trpc.auctions.getRoom.queryOptions({ id });

  // Awaited so a missing room is a 404; prefetchQuery does not throw, so a failure reaches the boundary.
  await queryClient.prefetchQuery(roomQuery);
  if (queryClient.getQueryData(roomQuery.queryKey) === null) notFound();

  return (
    <HydrateClient>
      <AuctionLive topic={`auction:room:${id}`} queryKey={roomQuery.queryKey}>
        <PageShell>
          <QueryBoundary fallback={<AuctionRoomSkeleton />}>
            <AuctionRoom id={id} />
          </QueryBoundary>
        </PageShell>
      </AuctionLive>
    </HydrateClient>
  );
}
