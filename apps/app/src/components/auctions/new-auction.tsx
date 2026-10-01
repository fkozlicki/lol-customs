"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { LiveAuctionNotice } from "@v1/ui/recipes/auctions/live-auction-notice";
import { useEffect } from "react";
import { useUser } from "@/components/auth/user-context";
import { useTRPC } from "@/trpc/react";
import { AuctionSetupForm } from "./auction-setup-form";

/**
 * Opening a new auction: a visitor is asked to sign in, a captain whose auction is live is sent back
 * to it, and one waiting in a lobby is told what creating does to it.
 */
export function NewAuction() {
  const trpc = useTRPC();
  const { profile, isLoading, openSignInDialog } = useUser();
  const { data: auctions } = useSuspenseQuery(
    trpc.auctions.listActive.queryOptions(),
  );
  const myAuction = auctions.find((auction) => auction.isMine);

  useEffect(() => {
    if (!isLoading && !profile) openSignInDialog();
  }, [isLoading, openSignInDialog, profile]);

  if (myAuction?.status === "active") {
    return <LiveAuctionNotice href={`/auctions/${myAuction.id}`} />;
  }

  return (
    <AuctionSetupForm
      notice={
        myAuction
          ? {
              kind: myAuction.mySide === "A" ? "replaces" : "leaves",
              teamA: myAuction.teamA.teamName,
              teamB: myAuction.teamB.teamName,
            }
          : null
      }
    />
  );
}
