"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { cn } from "../../utils/cn";
import { AnimatedNumber } from "../animated-number";
import { ProfileIcon } from "../game-assets/profile-icon";
import { DURATION } from "../motion";
import { WinLoss } from "../win-loss";
import type { StandingsRowView } from "./standings-view";

const BLOCK_HEIGHT = ["h-28 sm:h-44", "h-20 sm:h-32", "h-14 sm:h-24"] as const;

/** Rises 3rd, then 2nd, then 1st. */
const RISE_DELAY = [0.24, 0.12, 0] as const;

/** One step of the podium: the player on it, their rating and record, and the step rising. */
export function PodiumPlace({
  place,
  row,
}: {
  place: number;
  row: StandingsRowView | undefined;
}) {
  const isFirst = place === 0;
  const riseDelay = RISE_DELAY[place] ?? 0;
  const contentDelay = riseDelay + DURATION.slow;

  return (
    <div className="flex min-w-0 flex-col">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          inherit: true,
          delay: contentDelay,
          duration: DURATION.slow,
        }}
        className="flex min-w-0 flex-col items-start gap-2 pb-3 sm:gap-3 sm:pb-4"
      >
        {row ? (
          <Link
            href={row.href}
            className="group flex min-w-0 max-w-full flex-col items-start gap-2 sm:gap-3"
          >
            <ProfileIcon
              iconId={row.iconId}
              name={row.name}
              fallbackChars={1}
              avatarClassName={cn(
                "rounded-none",
                isFirst ? "size-12 sm:size-20" : "size-10 sm:size-14",
              )}
              fallbackClassName="rounded-none"
            />
            <span
              className={cn(
                "max-w-full truncate font-medium underline-offset-4 group-hover:underline",
                isFirst ? "text-sm sm:text-lg" : "text-xs sm:text-base",
              )}
            >
              {row.name}
            </span>
          </Link>
        ) : (
          <div
            className={cn(
              "flex items-center justify-center border border-dashed text-muted-foreground",
              isFirst ? "size-12 sm:size-20" : "size-10 sm:size-14",
            )}
          >
            ?
          </div>
        )}

        <div className="flex flex-col">
          {row ? (
            <AnimatedNumber
              value={row.rating}
              from={1000}
              delay={contentDelay}
              className={cn(
                "num font-semibold leading-none",
                isFirst ? "text-3xl sm:text-6xl" : "text-2xl sm:text-4xl",
              )}
            />
          ) : (
            <span
              className={cn(
                "num font-semibold leading-none text-muted-foreground",
                isFirst ? "text-3xl sm:text-6xl" : "text-2xl sm:text-4xl",
              )}
            >
              —
            </span>
          )}
          {row && (
            <span className="num mt-2 text-[11px] text-muted-foreground sm:text-xs">
              <WinLoss wins={row.wins} losses={row.losses} /> · {row.winrate}
            </span>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{
          inherit: true,
          delay: riseDelay,
          duration: DURATION.slow,
        }}
        style={{ originY: 1 }}
        className={cn(
          "relative flex items-start border-t-2 px-2 pt-2 sm:px-3",
          row
            ? "border-foreground bg-foreground/[0.06]"
            : "border-dashed border-border bg-muted/30",
          BLOCK_HEIGHT[place],
        )}
      >
        <span
          className={cn(
            "num font-semibold leading-none",
            row ? "text-foreground" : "text-muted-foreground",
            isFirst ? "text-4xl sm:text-7xl" : "text-3xl sm:text-5xl",
          )}
        >
          {place + 1}
        </span>
      </motion.div>
    </div>
  );
}
