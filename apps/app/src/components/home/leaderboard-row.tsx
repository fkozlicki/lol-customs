"use client";

import type { RouterOutputs } from "@v1/api";
import { QUALIFICATION_MATCHES } from "@v1/api/season";
import { playerHref } from "@v1/domain/riot-id";
import { formatKda, formatKdaRatio, formatWinrate } from "@v1/domain/stats";
import { cn } from "@v1/ui/cn";
import { motion } from "motion/react";
import Link from "next/link";
import { useSeasonParam } from "@/components/dashboard/use-season-param";
import { ProfileIcon } from "@/components/game-assets/profile-icon";
import { useScopedI18n } from "@/locales/client";
import { DURATION, STAGGER } from "@/utils/motion";
import { withSeason } from "@/utils/season";
import CurrentStreak from "./current-streak";

type LeaderboardRow = RouterOutputs["riftRank"]["leaderboard"][number];

interface LeaderboardRowProps {
  row: LeaderboardRow;
  /** Standings position; absent while the player is still qualifying. */
  position?: number;
  index: number;
}

export default function LeaderboardRow({
  row,
  position,
  index,
}: LeaderboardRowProps) {
  const t = useScopedI18n("dashboard.pages.leaderboard");
  const season = useSeasonParam();

  const name = row.player?.game_name ?? row.puuid.slice(0, 8);
  const wins = row.wins ?? 0;
  const losses = row.losses ?? 0;
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
          <QualifyingProgress matches={row.matches_played} />
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
        <Link
          href={withSeason(
            playerHref(row.player?.game_name, row.player?.tag_line),
            season,
          )}
          className="flex min-w-0 items-center gap-3"
        >
          <ProfileIcon
            iconId={row.player?.profile_icon ?? null}
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
          {Math.round(row.rating ?? 0)}
        </span>
      </td>
      <td className="num px-3 text-right text-muted-foreground">
        {formatWinrate(wins, losses)}
      </td>
      <td className="hidden px-3 text-right sm:table-cell">
        <div className="num flex flex-col items-end leading-tight">
          <span>{wins + losses}</span>
          <span className="text-[11px] text-muted-foreground">
            <span className="text-win">{wins}</span>–
            <span className="text-loss">{losses}</span>
          </span>
        </div>
      </td>
      <td className="hidden px-3 text-right md:table-cell">
        <div className="num flex flex-col items-end leading-tight">
          <span>
            {formatKdaRatio(row.avg_kills, row.avg_deaths, row.avg_assists)}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {formatKda(row.avg_kills, row.avg_deaths, row.avg_assists)}
          </span>
        </div>
      </td>
      <td
        className={cn(
          "num hidden px-3 text-right md:table-cell",
          row.mvp_games ? "text-mvp" : "text-muted-foreground",
        )}
      >
        {row.mvp_games ?? 0}
      </td>
      <td
        className={cn(
          "num hidden px-3 text-right md:table-cell",
          row.ace_games ? "text-ace" : "text-muted-foreground",
        )}
      >
        {row.ace_games ?? 0}
      </td>
      <td className="hidden pl-3 pr-4 text-right sm:table-cell sm:pr-0">
        <div className="flex flex-col items-end leading-tight">
          <CurrentStreak
            winStreak={row.win_streak}
            loseStreak={row.lose_streak}
          />
          {row.best_streak ? (
            <span className="num text-[11px] text-muted-foreground">
              {t("tableBest")} {row.best_streak}
            </span>
          ) : null}
        </div>
      </td>
    </motion.tr>
  );
}

function QualifyingProgress({ matches }: { matches: number }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="num text-[11px] text-muted-foreground">
        {matches}/{QUALIFICATION_MATCHES}
      </span>
      <div className="flex gap-0.5">
        {Array.from({ length: QUALIFICATION_MATCHES }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1 w-1.5",
              i < matches ? "bg-foreground" : "bg-border",
            )}
          />
        ))}
      </div>
    </div>
  );
}
