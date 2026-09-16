"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { QUALIFICATION_MATCHES } from "@v1/api/season";
import { cn } from "@v1/ui/cn";
import CurrentStreak from "@/components/home/current-streak";
import { useScopedI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/react";
import { formatKda, formatKdaRatio, formatWinrate } from "@/utils/stats";

interface PlayerStatsCardProps {
  puuid: string;
  season: number;
}

/** The ladder first: position, rating and record on the selected rating track. */
export function PlayerStatsCard({ puuid, season }: PlayerStatsCardProps) {
  const t = useScopedI18n("dashboard.pages.player");
  const trpc = useTRPC();
  const { data: stats } = useSuspenseQuery(
    trpc.players.profileStats.queryOptions({ puuid, season }),
  );

  if (!stats) return null;

  const wins = stats.wins ?? 0;
  const losses = stats.losses ?? 0;

  return (
    <div className="grid grid-cols-2 border-t border-l sm:grid-cols-4 lg:grid-cols-7">
      <Stat
        label={t("position")}
        className="col-span-2 sm:col-span-2 lg:col-span-2"
      >
        {stats.qualified && stats.position != null ? (
          <span className="num text-5xl font-semibold leading-none sm:text-6xl">
            #{String(stats.position).padStart(2, "0")}
          </span>
        ) : (
          <div className="flex flex-col gap-2">
            <span className="text-2xl font-semibold uppercase leading-none tracking-[-0.02em]">
              {t("qualifying")}
            </span>
            <span className="num text-xs text-muted-foreground">
              {t("qualifyingProgress", {
                matches: stats.matches_played,
                count: QUALIFICATION_MATCHES,
              })}
            </span>
          </div>
        )}
      </Stat>
      <Stat
        label={t("rating")}
        className="col-span-2 sm:col-span-2 lg:col-span-1"
      >
        <span className="num text-5xl font-semibold leading-none sm:text-6xl lg:text-4xl">
          {Math.round(stats.rating ?? 0)}
        </span>
      </Stat>
      <Stat label={t("record")}>
        <span className="num text-xl">
          <span className="text-win">{wins}</span>–
          <span className="text-loss">{losses}</span>
        </span>
        <span className="num text-xs text-muted-foreground">
          {formatWinrate(wins, losses)}
        </span>
      </Stat>
      <Stat label={t("kda")}>
        <span className="num text-xl">
          {formatKdaRatio(stats.avg_kills, stats.avg_deaths, stats.avg_assists)}
        </span>
        <span className="num text-xs text-muted-foreground">
          {formatKda(stats.avg_kills, stats.avg_deaths, stats.avg_assists)}
        </span>
      </Stat>
      <Stat label={`${t("mvp")} / ${t("ace")}`}>
        <span className="num text-xl">
          <span
            className={cn(
              stats.mvp_games ? "text-mvp" : "text-muted-foreground",
            )}
          >
            {stats.mvp_games ?? 0}
          </span>
          <span className="text-muted-foreground"> / </span>
          <span
            className={cn(
              stats.ace_games ? "text-ace" : "text-muted-foreground",
            )}
          >
            {stats.ace_games ?? 0}
          </span>
        </span>
      </Stat>
      <Stat label={t("streak")}>
        <span className="text-xl">
          <CurrentStreak
            winStreak={stats.win_streak}
            loseStreak={stats.lose_streak}
          />
        </span>
        <span className="num text-xs text-muted-foreground">
          {t("best", { count: stats.best_streak ?? 0 })}
        </span>
      </Stat>
    </div>
  );
}

function Stat({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex min-h-28 flex-col justify-between gap-3 border-r border-b p-4",
        className,
      )}
    >
      <span className="label-caps">{label}</span>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}
