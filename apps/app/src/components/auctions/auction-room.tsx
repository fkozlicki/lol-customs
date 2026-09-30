"use client";

import { useQuery } from "@tanstack/react-query";
import { AuctionBoard } from "@v1/ui/recipes/auctions/auction-board";
import { AuctionResults } from "@v1/ui/recipes/auctions/auction-results";
import { AuctionRoomClosed } from "@v1/ui/recipes/auctions/auction-room-closed";
import { AuctionRoomHeader } from "@v1/ui/recipes/auctions/auction-room-header";
import { AuctionRoomNotFound } from "@v1/ui/recipes/auctions/auction-room-not-found";
import { AuctionRoomSkeleton } from "@v1/ui/recipes/auctions/auction-room-skeleton";
import { PageShell } from "@v1/ui/recipes/page-shell";
import { useLocale } from "next-intl";
import { useCallback } from "react";
import { useTRPC } from "@/trpc/react";
import { AuctionLobby } from "./auction-lobby";
import {
  toAuctionEventViews,
  toAuctionRoomHeaderView,
  toAuctionStageView,
  toTeamRosterViews,
  toUpcomingOrder,
} from "./auction-room-view";
import { AuctionRoundControls } from "./auction-round-controls";
import { useAuctionRealtime } from "./use-auction-realtime";
import { useAuctionRoomActions } from "./use-auction-room-actions";

/** An auction room, kept current over realtime: the lobby, the live auction, or its results. */
export function AuctionRoom({ id }: { id: string }) {
  const locale = useLocale();
  const trpc = useTRPC();
  const query = useQuery(trpc.auctions.getRoom.queryOptions({ id }));
  const refresh = useCallback(() => {
    void query.refetch();
  }, [query.refetch]);
  const connection = useAuctionRealtime(`auction:room:${id}`, refresh);
  const actions = useAuctionRoomActions(id, refresh);
  const room = query.data;

  if (query.isLoading) return <AuctionRoomSkeleton />;
  if (!room || query.isError) return <AuctionRoomNotFound onRetry={refresh} />;
  if (room.status === "cancelled" || room.status === "expired") {
    return <AuctionRoomClosed status={room.status} />;
  }

  const bidding =
    room.permissions.mySide !== null && room.phase !== "sold_pause";

  return (
    <PageShell>
      <AuctionRoomHeader
        header={toAuctionRoomHeaderView(room)}
        connection={connection}
        cancelling={actions.cancelling}
        onCancel={actions.cancel}
      />

      {(room.status === "waiting" || room.status === "countdown") && (
        <AuctionLobby room={room} actions={actions} refresh={refresh} />
      )}

      {room.status === "active" && (
        <AuctionBoard
          rosters={toTeamRosterViews(room)}
          stage={toAuctionStageView(room)}
          controls={
            bidding ? (
              <AuctionRoundControls room={room} actions={actions} />
            ) : null
          }
          upcoming={toUpcomingOrder(room)}
          events={toAuctionEventViews(room, { locale })}
        />
      )}

      {room.status === "completed" && (
        <AuctionResults
          rosters={toTeamRosterViews(room)}
          events={toAuctionEventViews(room, { locale })}
        />
      )}
    </PageShell>
  );
}
