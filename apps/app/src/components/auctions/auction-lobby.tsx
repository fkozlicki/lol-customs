"use client";

import { AuctionLobby as AuctionLobbyView } from "@v1/ui/recipes/auctions/auction-lobby";
import { AuctionSetupSkeleton } from "@v1/ui/recipes/auctions/auction-setup-skeleton";
import { toast } from "@v1/ui/sonner";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useUser } from "@/components/auth/user-context";
import { QueryBoundary } from "@/components/query-boundary";
import { type AuctionRoomSnapshot, captainFor } from "./auction-contract";
import { toLobbyView } from "./auction-room-view";
import { AuctionSetupForm } from "./auction-setup-form";
import type { useAuctionRoomActions } from "./use-auction-room-actions";

interface AuctionLobbyProps {
  room: AuctionRoomSnapshot;
  actions: ReturnType<typeof useAuctionRoomActions>;
  refresh: () => void;
}

/** The lobby, wired to the room's actions: readiness, the seats, renaming, and editing the pool. */
export function AuctionLobby({ room, actions, refresh }: AuctionLobbyProps) {
  const t = useTranslations("dashboard.pages.auctions");
  const { profile, openSignInDialog } = useUser();
  const [editingPool, setEditingPool] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const lobby = toLobbyView(room);
  const { mySide, canLeave } = room.permissions;
  const myTeamName = mySide ? captainFor(room, mySide)?.teamName : undefined;

  function saveTeamName(input: string) {
    const name = input.trim();
    if (!name || name === myTeamName) {
      setRenaming(false);
      return;
    }
    actions.rename(name, { onSuccess: () => setRenaming(false) });
  }

  async function copyInviteLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success(t("lobby.linkCopied"));
    } catch {
      toast.error(t("lobby.linkCopyFailed"));
    }
  }

  return (
    <AuctionLobbyView
      lobby={lobby}
      renaming={renaming}
      busy={{
        ready: actions.readying,
        seat: actions.seatChanging,
        rename: actions.renaming,
        join: actions.joining,
      }}
      onToggleReady={() => actions.setReady(!lobby.ready?.ready)}
      onRenameStart={() => setRenaming(true)}
      onRenameSave={saveTeamName}
      onRenameCancel={() => setRenaming(false)}
      onSeatAction={canLeave ? actions.leave : actions.removeCaptain}
      onJoin={() =>
        profile ? actions.join(t("room.teamB")) : openSignInDialog()
      }
      onCopyInvite={copyInviteLink}
      onEditPool={() => setEditingPool(true)}
      poolEditor={
        editingPool ? (
          <QueryBoundary fallback={<AuctionSetupSkeleton />}>
            <AuctionSetupForm
              roomId={room.id}
              initialPlayers={room.players.map((player) => ({
                gameName: player.gameName,
                tagLine: player.tagLine,
                rankTier: player.soloTier,
                rankDivision: player.soloDivision,
              }))}
              initialBudget={room.budget}
              initialBidSeconds={room.bidSeconds}
              initialRevealOrder={room.showOrder}
              onUpdated={() => {
                setEditingPool(false);
                refresh();
              }}
              onCancel={() => setEditingPool(false)}
            />
          </QueryBoundary>
        ) : undefined
      }
    />
  );
}
