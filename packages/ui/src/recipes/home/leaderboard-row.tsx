"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "../../utils/cn";
import { ProfileIcon } from "../game-assets/profile-icon";
import { DURATION, STAGGER } from "../motion";
import { WinLoss } from "../win-loss";
import CurrentStreak from "./current-streak";
import { QualifyingProgress } from "./qualifying-progress";
import type { StandingsRowView } from "./standings-view";

interface LeaderboardRowProps {
  row: StandingsRowView;
  /** Position in the table, for the stagger as rows enter. */
  index: number;
  /** How many matches qualify a player; the app's rule, drawn as the progress of a qualifying row. */
  qualificationMatches: number;
}

/** A row of the standings table: position, player, rating and the season's numbers. */
export default function LeaderboardRow({
  row,
  index,
  qualificationMatches,
}: LeaderboardRowProps) {
  const t = useTranslations("standings");
  const { position, name, wins, losses } = row;
  const isQualifying = position == null;

  return (
    <motion.tr
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        inherit: true,
        delay: Math.min(index, 15) * STAGGER,
        duration: DURATION.base,
      }}
      className="group border-b transition-colors hover:bg-muted/40"
    >
      <td className="h-14 pl-4 pr-3 sm:pl-0">
        {isQualifying ? (
          <QualifyingProgress
            matches={row.matchesPlayed}
            of={qualificationMatches}
          />
        ) : (
          <span
            className={cn(
              "num",
              position <= 3
                ? "font-semibold text-foreground"
                : "text-muted-foreground",
            )}
          >
            {String(position).padStart(2, "0")}
          </span>
        )}
      </td>
      <td className="px-3">
        <Link href={row.href} className="flex min-w-0 items-center gap-3">
          <ProfileIcon
            iconId={row.iconId}
            name={name}
            fallbackChars={1}
            avatarClassName="size-8 rounded-none"
            fallbackClassName="rounded-none text-xs"
          />
          <span className="truncate font-medium underline-offset-4 group-hover:underline">
            {name}
          </span>
        </Link>
      </td>
      <td className="px-3 text-right">
        <span
          className={cn(
            "num text-base font-semibold",
            isQualifying && "font-normal text-muted-foreground",
          )}
        >
          {row.rating}
        </span>
      </td>
      <td className="num px-3 text-right text-muted-foreground">
        {row.winrate}
      </td>
      <td className="hidden px-3 text-right sm:table-cell">
        <div className="num flex flex-col items-end leading-tight">
          <span>{wins + losses}</span>
          <WinLoss wins={wins} losses={losses} className="text-[11px]" />
        </div>
      </td>
      <td className="hidden px-3 text-right md:table-cell">
        <div className="num flex flex-col items-end leading-tight">
          <span>{row.kdaRatio}</span>
          <span className="text-[11px] text-muted-foreground">{row.kda}</span>
        </div>
      </td>
      <td
        className={cn(
          "num hidden px-3 text-right md:table-cell",
          row.mvpGames ? "text-mvp" : "text-muted-foreground",
        )}
      >
        {row.mvpGames}
      </td>
      <td
        className={cn(
          "num hidden px-3 text-right md:table-cell",
          row.aceGames ? "text-ace" : "text-muted-foreground",
        )}
      >
        {row.aceGames}
      </td>
      <td className="hidden pl-3 pr-4 text-right sm:table-cell sm:pr-0">
        <div className="flex flex-col items-end leading-tight">
          <CurrentStreak
            winStreak={row.winStreak}
            loseStreak={row.loseStreak}
          />
          {row.bestStreak ? (
            <span className="num text-[11px] text-muted-foreground">
              {t("best")} {row.bestStreak}
            </span>
          ) : null}
        </div>
      </td>
    </motion.tr>
  );
}
