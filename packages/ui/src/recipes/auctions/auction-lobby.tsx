"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Button } from "../../components/button";
import { AuctionCountdown } from "./auction-countdown";
import type { LobbyView } from "./auction-room-view";
import { LobbyPool } from "./lobby-pool";
import { LobbyTeam, type LobbyTeamProps } from "./lobby-team";

type TeamActions = Omit<LobbyTeamProps, "team" | "renaming" | "busy">;

interface AuctionLobbyProps extends TeamActions {
  lobby: LobbyView;
  /** The viewer is renaming their team. */
  renaming: boolean;
  busy: { ready: boolean; seat: boolean; rename: boolean; join: boolean };
  onToggleReady: () => void;
  /** Takes the pool's place while the creator edits it. */
  poolEditor?: ReactNode;
  onEditPool: () => void;
}

/** The room before the auction: the two teams and their readiness, the countdown, and the pool. */
export function AuctionLobby({
  lobby,
  renaming,
  busy,
  onToggleReady,
  poolEditor,
  onEditPool,
  ...teamActions
}: AuctionLobbyProps) {
  const t = useTranslations("auctions");
  const team = (side: "A" | "B") => (
    <LobbyTeam
      team={lobby.teams[side]}
      renaming={renaming && lobby.teams[side].canRename}
      busy={busy}
      {...teamActions}
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
          disabled={!lobby.ready.allowed || busy.ready}
          onClick={onToggleReady}
        >
          {lobby.ready.ready ? t("actions.unready") : t("actions.ready")}
        </Button>
      )}

      {poolEditor ?? (
        <LobbyPool
          players={lobby.pool}
          onEdit={lobby.canEditPool ? onEditPool : undefined}
        />
      )}
    </div>
  );
}
