"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { AuctionBoard } from "@v1/ui/recipes/auctions/auction-board";
import { AuctionResults } from "@v1/ui/recipes/auctions/auction-results";
import { AuctionRoomClosed } from "@v1/ui/recipes/auctions/auction-room-closed";
import { AuctionRoomHeader } from "@v1/ui/recipes/auctions/auction-room-header";
import { NotFound } from "@v1/ui/recipes/not-found";
import { useLocale } from "next-intl";
import { useTRPC } from "@/trpc/react";
import { AuctionLiveBadge } from "./auction-live-badge";
import { AuctionLobby } from "./auction-lobby";
import {
  toAuctionEventViews,
  toAuctionRoomHeaderView,
  toAuctionStageView,
  toTeamRosterViews,
  toUpcomingOrder,
} from "./auction-room-view";
import { AuctionRoundControls } from "./auction-round-controls";
import { CancelAuctionButton } from "./cancel-auction-button";
import { useAuctionRoomActions } from "./use-auction-room-actions";

/** An auction room, kept current by the page's `AuctionLive`: the lobby, the live auction, or its results. */
export function AuctionRoom({ id }: { id: string }) {
  const locale = useLocale();
  const trpc = useTRPC();
  const { data: room } = useSuspenseQuery(
    trpc.auctions.getRoom.queryOptions({ id }),
  );
  const actions = useAuctionRoomActions(id);

  // The page answers a missing room with a 404; this is a room that went away while open.
  if (!room) return <NotFound homeHref="/" />;
  if (room.status === "cancelled" || room.status === "expired") {
    return <AuctionRoomClosed status={room.status} />;
  }

  const bidding =
    room.permissions.mySide !== null && room.phase !== "sold_pause";

  return (
    <>
      <AuctionRoomHeader
        header={toAuctionRoomHeaderView(room)}
        status={<AuctionLiveBadge />}
        action={
          room.permissions.canCancel ? (
            <CancelAuctionButton roomId={room.id} />
          ) : null
        }
      />

      {(room.status === "waiting" || room.status === "countdown") && (
        <AuctionLobby room={room} actions={actions} />
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
    </>
  );
}
