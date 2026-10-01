"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { AuctionCompletedBanner } from "@v1/ui/recipes/auctions/auction-completed-banner";
import { AuctionRoomClosed } from "@v1/ui/recipes/auctions/auction-room-closed";
import { AuctionRoomHeader } from "@v1/ui/recipes/auctions/auction-room-header";
import { AuctionStage } from "@v1/ui/recipes/auctions/auction-stage";
import { EventFeed } from "@v1/ui/recipes/auctions/event-feed";
import { TeamRoster } from "@v1/ui/recipes/auctions/team-roster";
import { UpcomingOrder } from "@v1/ui/recipes/auctions/upcoming-order";
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
  const rosters = toTeamRosterViews(room);
  const upcoming = toUpcomingOrder(room);

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

      {/* The stage between the two rosters, the feed beside Team B; on phones the stage comes first. */}
      {room.status === "active" && (
        <div className="grid gap-10 lg:grid-cols-[minmax(260px,320px)_minmax(0,1fr)_minmax(260px,320px)] lg:gap-12">
          <div className="order-2 lg:order-1">
            <TeamRoster roster={rosters.A} />
          </div>
          <div className="order-1 space-y-8 lg:order-2">
            <AuctionStage
              stage={toAuctionStageView(room)}
              controls={
                bidding ? (
                  <AuctionRoundControls room={room} actions={actions} />
                ) : null
              }
            />
            {upcoming && <UpcomingOrder players={upcoming} />}
          </div>
          <div className="order-3 space-y-10">
            <TeamRoster roster={rosters.B} />
            <EventFeed events={toAuctionEventViews(room, { locale })} />
          </div>
        </div>
      )}

      {room.status === "completed" && (
        <>
          <AuctionCompletedBanner />
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_360px]">
            <TeamRoster roster={rosters.A} />
            <TeamRoster roster={rosters.B} />
            <EventFeed events={toAuctionEventViews(room, { locale })} />
          </div>
        </>
      )}
    </>
  );
}
