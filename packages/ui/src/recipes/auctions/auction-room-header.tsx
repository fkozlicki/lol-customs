"use client";

import { useTranslations } from "next-intl";
import { Button } from "../../components/button";
import type { AuctionRoomHeaderView } from "./auction-room-view";
import { ConnectionBadge } from "./connection-badge";

interface AuctionRoomHeaderProps {
  header: AuctionRoomHeaderView;
  connection: "connecting" | "live" | "degraded";
  cancelling: boolean;
  onCancel: () => void;
}

/** The room's status, how it keeps up, the two teams, and the creator's way to call it off. */
export function AuctionRoomHeader({
  header,
  connection,
  cancelling,
  onCancel,
}: AuctionRoomHeaderProps) {
  const t = useTranslations("auctions");

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
      <div className="min-w-0">
        <div className="flex items-center gap-4">
          <span className="label-caps text-foreground">
            {t(`status.${header.status}`)}
          </span>
          <ConnectionBadge state={connection} />
        </div>
        <h1 className="mt-2 truncate text-2xl font-semibold uppercase tracking-[-0.03em] sm:text-4xl">
          {header.teamA ?? t("room.teamA")}{" "}
          <span className="text-muted-foreground">{t("room.versus")}</span>{" "}
          {header.teamB ?? t("room.teamB")}
        </h1>
      </div>
      {header.canCancel && (
        <Button variant="outline" disabled={cancelling} onClick={onCancel}>
          {t("actions.cancel")}
        </Button>
      )}
    </header>
  );
}
