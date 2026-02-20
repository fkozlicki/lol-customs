"use client";

import type { RouterOutputs } from "@v1/api";
import { Avatar, AvatarFallback, AvatarImage } from "@v1/ui/avatar";
import { cn } from "@v1/ui/cn";
import { Icons } from "@v1/ui/icons";
import { TableCell, TableRow } from "@v1/ui/table";
import { useScopedI18n } from "@/locales/client";
import { BestStreak } from "./best-streak";
import CurrentStreak from "./current-streak";
import RankBadge from "./rank-badge";

type LeaderboardRow = RouterOutputs["riftRank"]["leaderboard"][number];

interface LeaderboardRowProps {
  row: LeaderboardRow;
  index: number;
}

// Community Dragon has "latest" and includes all profile icons (e.g. 7091)
const PROFILE_ICON_CDN =
  "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons";

function profileIconUrl(iconId: number | null): string | null {
  if (iconId == null) return null;
  return `${PROFILE_ICON_CDN}/${iconId}.jpg`;
}

function winrate(wins: number | null, losses: number | null): string {
  if (wins == null || losses == null) return "—";
  const total = wins + losses;
  if (total === 0) return "0%";
  return `${Math.round((wins / total) * 100)}%`;
}

function formatKdaStat(value: number): string {
  return value.toFixed(1).replace(/\.0$/, "");
}

function formatKda(
  avgKills: number | null,
  avgDeaths: number | null,
  avgAssists: number | null,
): string {
  if (avgKills == null && avgDeaths == null && avgAssists == null) return "—";
  const k = formatKdaStat(avgKills ?? 0);
  const d = formatKdaStat(avgDeaths ?? 0);
  const a = formatKdaStat(avgAssists ?? 0);
  return `${k} / ${d} / ${a}`;
}

function calculateKda(
  avgKills: number | null,
  avgDeaths: number | null,
  avgAssists: number | null,
): number {
  if (avgKills == null && avgDeaths == null && avgAssists == null) return 0;
  return ((avgKills ?? 0) + (avgAssists ?? 0)) / (avgDeaths ?? 1);
}

export default function LeaderboardRow({ row, index }: LeaderboardRowProps) {
  const t = useScopedI18n("dashboard.pages.leaderboard");

  const rank = index + 1;
  const name = row.player?.game_name
    ? `${row.player.game_name}`
    : row.puuid.slice(0, 8);
  const iconUrl = profileIconUrl(row.player?.profile_icon ?? null);
  const isLeader = rank === 1;
  const isTopThree = rank <= 3;

  return (
    <TableRow
      key={row.puuid}
      className={cn(
        "border-b border-border/40 last:border-0",
        "hover:bg-muted/40",
        isLeader && "bg-amber-500/5 dark:bg-amber-500/10 hover:bg-amber-500/10",
        isTopThree && !isLeader && "bg-muted/20",
      )}
    >
      <TableCell className="px-4 py-3">
        <div className="flex justify-start">
          <RankBadge
            rank={rank}
            labels={{
              rank1st: t("rank1st"),
              rank2nd: t("rank2nd"),
              rank3rd: t("rank3rd"),
            }}
          />
        </div>
      </TableCell>
      <TableCell className="whitespace-nowrap px-4 py-3">
        <div className={cn("flex items-center gap-3 font-medium")}>
          <Avatar
            className={cn(
              "shrink-0 ring-2 ring-border/50",
              isLeader ? "size-11 ring-amber-500/40" : "size-9",
            )}
          >
            {iconUrl ? (
              <AvatarImage src={iconUrl} alt="" className="object-cover" />
            ) : null}
            <AvatarFallback
              className={cn(
                "bg-muted text-muted-foreground text-xs",
                isLeader &&
                  "bg-amber-500/10 text-amber-700 dark:text-amber-400",
              )}
            >
              {name.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className={cn(isLeader && "font-semibold text-foreground")}>
            {name}
          </span>
          {isLeader && (
            <Icons.Leaderboard className="size-4 text-amber-500 dark:text-amber-400 shrink-0" />
          )}
        </div>
      </TableCell>
      <TableCell className="px-4 py-3 text-center font-medium">
        {Math.round(row.rating ?? 0)}
      </TableCell>

      <TableCell className="px-4 py-3 text-center">
        <div className=" flex flex-col items-center">
          <span className="font-medium text-xs">
            {winrate(row.wins, row.losses)}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {row.wins ?? 0}/{row.losses ?? 0}
          </span>
        </div>
      </TableCell>
      <TableCell className="px-4 py-3">
        <div className="flex flex-col items-center">
          <span className="text-xs font-medium">
            {calculateKda(
              row.avg_kills,
              row.avg_deaths,
              row.avg_assists,
            ).toFixed(2)}
            :1
          </span>
          <span className="text-[11px] text-muted-foreground">
            {formatKda(row.avg_kills, row.avg_deaths, row.avg_assists)}
          </span>
        </div>
      </TableCell>
      <TableCell className="px-4 py-3">
        <div className="flex flex-col items-center">
          <CurrentStreak
            winStreak={row.win_streak}
            loseStreak={row.lose_streak}
          />
          {row.best_streak ? <BestStreak value={row.best_streak} /> : null}
        </div>
      </TableCell>
    </TableRow>
  );
}
