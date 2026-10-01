"use client";

import { useTranslations } from "next-intl";
import type { AuctionRoomHeaderView } from "./auction-room-view";

interface AuctionRoomHeaderProps {
  header: AuctionRoomHeaderView;
  /** Beside the room's status: how the page keeps up with it. */
  status?: React.ReactNode;
  /** At the end of the header: the creator's way to call the room off. */
  action?: React.ReactNode;
}

/** The room's status, how it keeps up, the two teams, and what the viewer may do about the room. */
export function AuctionRoomHeader({
  header,
  status,
  action,
}: AuctionRoomHeaderProps) {
  const t = useTranslations("auctions");

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
      <div className="min-w-0">
        <div className="flex items-center gap-4">
          <span className="label-caps text-foreground">
            {t(`status.${header.status}`)}
          </span>
          {status}
        </div>
        <h1 className="mt-2 truncate text-2xl font-semibold uppercase tracking-[-0.03em] sm:text-4xl">
          {header.teamA ?? t("room.teamA")}{" "}
          <span className="text-muted-foreground">{t("room.versus")}</span>{" "}
          {header.teamB ?? t("room.teamB")}
        </h1>
      </div>
      {action}
    </header>
  );
}
