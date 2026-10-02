"use client";

import { Button } from "@v1/ui/button";
import { AuctionCountdown } from "@v1/ui/recipes/auctions/auction-countdown";
import { LobbyPool } from "@v1/ui/recipes/auctions/lobby-pool";
import { LobbyTeam } from "@v1/ui/recipes/auctions/lobby-team";
import { toast } from "@v1/ui/sonner";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useUser } from "@/components/auth/user-context";
import { type AuctionRoomSnapshot, captainFor } from "./auction-contract";
import { AuctionPoolEditor } from "./auction-pool-editor";
import { toLobbyView } from "./auction-room-view";
import type { useAuctionRoomActions } from "./use-auction-room-actions";

interface AuctionLobbyProps {
  room: AuctionRoomSnapshot;
  actions: ReturnType<typeof useAuctionRoomActions>;
}

/**
 * The room before the auction, wired to its actions: the two teams and their seats, the countdown,
 * readiness, renaming, and the pool, which the creator can edit.
 */
export function AuctionLobby({ room, actions }: AuctionLobbyProps) {
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

  const busy = {
    seat: actions.seatChanging,
    rename: actions.renaming,
    join: actions.joining,
  };
  const team = (side: "A" | "B") => (
    <LobbyTeam
      team={lobby.teams[side]}
      renaming={renaming && lobby.teams[side].canRename}
      busy={busy}
      onRenameStart={() => setRenaming(true)}
      onRenameSave={saveTeamName}
      onRenameCancel={() => setRenaming(false)}
      onSeatAction={canLeave ? actions.leave : actions.removeCaptain}
      onJoin={() =>
        profile ? actions.join(t("room.teamB")) : openSignInDialog()
      }
      onCopyInvite={copyInviteLink}
    />
  );

  return (
    <div className="space-y-12">
      {lobby.countdown && (
        <div className="space-y-2">
          <p className="label-caps text-foreground">{t("lobby.starting")}</p>
          <AuctionCountdown {...lobby.countdown} />
        </div>
      )}

      <section className="grid gap-8 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:gap-12">
        {team("A")}
        <span className="label-caps hidden pt-2 sm:block">
          {t("room.versus")}
        </span>
        {team("B")}
      </section>

      {lobby.ready && (
        <Button
          size="lg"
          disabled={!lobby.ready.allowed || actions.readying}
          onClick={() => actions.setReady(!lobby.ready?.ready)}
        >
          {lobby.ready.ready ? t("lobby.unready") : t("lobby.ready")}
        </Button>
      )}

      {editingPool ? (
        <AuctionPoolEditor room={room} onClose={() => setEditingPool(false)} />
      ) : (
        <LobbyPool
          players={lobby.pool}
          onEdit={lobby.canEditPool ? () => setEditingPool(true) : undefined}
        />
      )}
    </div>
  );
}
