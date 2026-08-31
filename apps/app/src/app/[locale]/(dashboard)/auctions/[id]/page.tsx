import { AuctionRoom } from "@/components/auctions/auction-room";

export default async function AuctionRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AuctionRoom id={id} />;
}
