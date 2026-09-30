"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { RankTag } from "../rank-tag";
import { AuctionCountdown } from "./auction-countdown";
import type { AuctionStageView } from "./auction-room-view";

interface AuctionStageProps {
  stage: AuctionStageView;
  /** The viewer's bidding controls, when they captain a team and the round is open. */
  controls?: ReactNode;
}

/** The player on sale, the price and who leads, and the clock that closes the round. */
export function AuctionStage({ stage, controls }: AuctionStageProps) {
  const t = useTranslations("auctions");

  return (
    <section className="flex min-h-[26rem] flex-col justify-between gap-8 border-b pb-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <span className="label-caps block text-foreground">
            {t(`phase.${stage.phase}`)}
          </span>
          {stage.round && (
            <span className="label-caps block">
              {t("room.round", {
                round: stage.round.number,
                total: stage.round.total,
              })}
            </span>
          )}
        </div>
        {stage.leadingTeam && (
          <span className="label-caps bg-foreground px-2 py-1 text-background">
            {t("room.leading", { team: stage.leadingTeam })}
          </span>
        )}
      </div>

      {stage.player ? (
        <>
          <div className="flex flex-col items-center gap-2 text-center">
            <h2 className="max-w-full truncate text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">
              {stage.player.name}
            </h2>
            <RankTag tier={stage.player.rankTier}>
              {stage.player.rankLabel ?? t("room.unranked")}
            </RankTag>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 sm:items-end">
            <div>
              <p className="label-caps">{t("room.currentPrice")}</p>
              <p className="num text-6xl font-semibold leading-none sm:text-7xl">
                ${stage.price}
              </p>
              {stage.openedBy && (
                <p className="label-caps mt-2">
                  {t("room.opened", { team: stage.openedBy })}
                </p>
              )}
            </div>
            <div className="sm:text-right">
              {stage.countdown ? (
                <AuctionCountdown {...stage.countdown} />
              ) : (
                <p className="text-lg font-semibold uppercase tracking-[-0.02em]">
                  {t("room.soldPause")}
                </p>
              )}
            </div>
          </div>

          {controls}
        </>
      ) : (
        <p className="text-center text-muted-foreground">
          {t("room.preparingPlayer")}
        </p>
      )}
    </section>
  );
}
