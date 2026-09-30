"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "../../utils/cn";
import type { AuctionSummaryView } from "./auction-list-view";

/**
 * One auction in the list: its state (pulsing while live), the two teams and captains, and either
 * who the lobby waits for or who is on the stage at what price.
 */
export function AuctionSummaryCard({
  auction,
}: {
  auction: AuctionSummaryView;
}) {
  const t = useTranslations("auctions");

  return (
    <Link href={auction.href} className="group block">
      <div className="flex items-center gap-3 pb-4">
        <span
          className={cn(
            "size-1.5",
            auction.status === "active"
              ? "animate-pulse bg-foreground"
              : "bg-muted-foreground",
          )}
        />
        <span className="label-caps text-foreground">
          {t(`status.${auction.status}`)}
        </span>
        {auction.isMine && (
          <span className="label-caps bg-foreground px-1.5 text-background">
            {t("list.yours")}
          </span>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div className="min-w-0 space-y-2">
          <h2 className="text-3xl font-semibold uppercase leading-[0.95] tracking-[-0.03em] sm:text-5xl">
            {auction.teamAName}
            <span className="text-muted-foreground"> {t("room.versus")} </span>
            {auction.teamBName}
          </h2>
          <p className="truncate text-xs text-muted-foreground">
            {auction.captains.join(" · ")}
          </p>
        </div>

        <div className="flex items-end gap-8 sm:justify-end">
          {auction.status === "waiting" ? (
            <p className="text-sm font-medium">
              {auction.hasSecondCaptain
                ? t("list.waitingReady")
                : t("list.lookingForCaptain")}
            </p>
          ) : (
            <>
              <div className="min-w-0">
                <p className="label-caps">{t("list.onStage")}</p>
                <p className="truncate text-sm font-medium">
                  {auction.currentPlayerName ?? t("list.starting")}
                </p>
              </div>
              <div className="text-right">
                <p className="label-caps">{t("list.price")}</p>
                <p className="num text-4xl font-semibold leading-none">
                  ${auction.currentBid}
                </p>
              </div>
            </>
          )}
          <span className="label-caps hidden text-foreground underline-offset-4 group-hover:underline sm:block">
            {t("list.watch")} →
          </span>
        </div>
      </div>
    </Link>
  );
}
