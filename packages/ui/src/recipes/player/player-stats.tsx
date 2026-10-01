"use client";

import { useTranslations } from "next-intl";
import { cn } from "../../utils/cn";
import CurrentStreak from "../home/current-streak";
import type { StandingsRowView } from "../home/standings-view";
import { WinLoss } from "../win-loss";
import { StatCell } from "./stat-cell";

interface PlayerStatsProps {
  /** The player's line on the selected rating track, as the standings show it. */
  stats: StandingsRowView;
  /** How many matches qualify a player, for the progress while they still are qualifying. */
  qualificationMatches: number;
}

/** The ladder first: position, rating and record on the selected rating track. */
export function PlayerStats({ stats, qualificationMatches }: PlayerStatsProps) {
  const t = useTranslations("player");

  return (
    <div className="grid grid-cols-2 border-t border-l sm:grid-cols-4 lg:grid-cols-7">
      <StatCell label={t("position")} className="sm:col-span-2">
        {stats.position != null ? (
          <span className="num text-4xl font-semibold leading-none sm:text-6xl">
            #{String(stats.position).padStart(2, "0")}
          </span>
        ) : (
          <div className="flex flex-col gap-2">
            <span className="text-lg font-semibold uppercase leading-none tracking-[-0.02em] sm:text-2xl">
              {t("qualifying")}
            </span>
            <span className="num text-xs text-muted-foreground">
              {t("qualifyingProgress", {
                matches: stats.matchesPlayed,
                count: qualificationMatches,
              })}
            </span>
          </div>
        )}
      </StatCell>
      <StatCell label={t("rating")} className="sm:col-span-2 lg:col-span-1">
        <span className="num text-4xl font-semibold leading-none sm:text-6xl lg:text-4xl">
          {stats.rating}
        </span>
      </StatCell>
      <StatCell label={t("record")}>
        <WinLoss wins={stats.wins} losses={stats.losses} className="text-xl" />
        <span className="num text-xs text-muted-foreground">
          {stats.winrate}
        </span>
      </StatCell>
      <StatCell label={t("kda")}>
        <span className="num text-xl">{stats.kdaRatio}</span>
        <span className="num text-xs text-muted-foreground">{stats.kda}</span>
      </StatCell>
      <StatCell label={`${t("mvp")} / ${t("ace")}`}>
        <span className="num text-xl">
          <span
            className={cn(
              stats.mvpGames ? "text-mvp" : "text-muted-foreground",
            )}
          >
            {stats.mvpGames}
          </span>
          <span className="text-muted-foreground"> / </span>
          <span
            className={cn(
              stats.aceGames ? "text-ace" : "text-muted-foreground",
            )}
          >
            {stats.aceGames}
          </span>
        </span>
      </StatCell>
      <StatCell label={t("streak")}>
        <span className="text-xl">
          <CurrentStreak
            winStreak={stats.winStreak}
            loseStreak={stats.loseStreak}
          />
        </span>
        <span className="num text-xs text-muted-foreground">
          {t("best", { count: stats.bestStreak ?? 0 })}
        </span>
      </StatCell>
    </div>
  );
}
