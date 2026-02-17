"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import type { RouterOutputs } from "@v1/api";
import { Avatar, AvatarFallback, AvatarImage } from "@v1/ui/avatar";
import { Badge } from "@v1/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@v1/ui/card";
import { cn } from "@v1/ui/cn";
import { Icons } from "@v1/ui/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@v1/ui/table";
import { useScopedI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/react";

// Community Dragon has "latest" and includes all profile icons (e.g. 7091)
const PROFILE_ICON_CDN =
  "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons";

type LeaderboardRow = RouterOutputs["riftRank"]["leaderboard"][number];

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

function formatCurrentStreak(
  winStreak: number | null,
  loseStreak: number | null,
): string {
  const w = winStreak ?? 0;
  const l = loseStreak ?? 0;
  if (w > 0) return `${w}`;
  if (l > 0) return `${l}`;
  return "0";
}

function RankBadge({
  rank,
  labels,
}: {
  rank: number;
  labels: { rank1st: string; rank2nd: string; rank3rd: string };
}) {
  if (rank > 3) return <span className="tabular-nums">{rank}</span>;
  const styles = [
    "bg-amber-500/15 text-amber-700 dark:text-amber-400 dark:bg-amber-500/20 border-amber-500/30",
    "bg-zinc-400/15 text-zinc-600 dark:text-zinc-400 dark:bg-zinc-400/20 border-zinc-400/30",
    "bg-amber-700/20 text-amber-800 dark:text-amber-600 dark:bg-amber-600/25 border-amber-700/40",
  ];
  const label = [labels.rank1st, labels.rank2nd, labels.rank3rd][rank - 1];
  return (
    <Badge
      variant="outline"
      className={cn(
        "tabular-nums font-semibold shrink-0 border",
        styles[rank - 1],
      )}
    >
      {label}
    </Badge>
  );
}

function CurrentStreakCell({
  winStreak,
  loseStreak,
}: {
  winStreak: number | null;
  loseStreak: number | null;
}) {
  const w = winStreak ?? 0;
  const l = loseStreak ?? 0;
  const hasStreak = w > 0 || l > 0;
  const isWinning = w > 0;
  return (
    <span className="flex items-center justify-end gap-1 tabular-nums">
      {hasStreak && (
        <Icons.Flame
          className={cn(
            "size-3.5 shrink-0",
            isWinning
              ? "text-amber-500 dark:text-amber-400"
              : "text-blue-500 dark:text-blue-400",
          )}
        />
      )}
      {formatCurrentStreak(winStreak, loseStreak)}
    </span>
  );
}

function BestStreakCell({ value }: { value: number | null }) {
  const hasBest = value != null && value > 0;
  return (
    <span className="text-muted-foreground flex items-center justify-end gap-1 tabular-nums">
      {hasBest && (
        <Icons.Flame className="size-3.5 text-amber-500/70 dark:text-amber-400/70 shrink-0" />
      )}
      {value != null ? String(value) : "—"}
    </span>
  );
}

interface LeaderboardProps {
  limit?: number;
}

export function Leaderboard({ limit = 50 }: LeaderboardProps) {
  const t = useScopedI18n("dashboard.pages.leaderboard");
  const trpc = useTRPC();
  const { data: leaderboard } = useSuspenseQuery(
    trpc.riftRank.leaderboard.queryOptions({ limit }),
  );

  if (!leaderboard?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("emptyTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">{t("noPlayersYet")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="border rounded-2xl">
      <Table>
        <TableHeader>
          <TableRow className="text-muted-foreground border-b bg-muted/20 hover:bg-muted/20">
            <TableHead className="w-14 px-4 py-3">
              <Icons.Leaderboard className="size-4" />
            </TableHead>
            <TableHead className="min-w-[200px] px-4 py-3">
              {t("tablePlayer")}
            </TableHead>
            <TableHead className="w-20 px-4 py-3 text-right">
              {t("tableRating")}
            </TableHead>
            <TableHead className="w-16 px-4 py-3 text-right">
              {t("tableWl")}
            </TableHead>
            <TableHead className="w-14 px-4 py-3 text-right">
              {t("tableWr")}
            </TableHead>
            <TableHead className="w-20 px-4 py-3 text-right">
              {t("tableStreak")}
            </TableHead>
            <TableHead className="w-16 px-4 py-3 text-right">
              {t("tableBest")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leaderboard.map((row: LeaderboardRow, index: number) => {
            const rank = index + 1;
            const name =
              row.player?.game_name && row.player?.tag_line
                ? `${row.player.game_name}#${row.player.tag_line}`
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
                  isLeader &&
                    "bg-amber-500/5 dark:bg-amber-500/10 hover:bg-amber-500/10",
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
                        <AvatarImage
                          src={iconUrl}
                          alt=""
                          className="object-cover"
                        />
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
                    <span
                      className={cn(
                        isLeader && "font-semibold text-foreground",
                      )}
                    >
                      {name}
                    </span>
                    {isLeader && (
                      <Icons.Leaderboard className="size-4 text-amber-500 dark:text-amber-400 shrink-0" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3 text-right tabular-nums font-medium">
                  {row.rating ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground px-4 py-3 text-right tabular-nums">
                  {row.wins ?? 0}/{row.losses ?? 0}
                </TableCell>
                <TableCell className="text-muted-foreground px-4 py-3 text-right tabular-nums">
                  {winrate(row.wins, row.losses)}
                </TableCell>
                <TableCell className="px-4 py-3">
                  <CurrentStreakCell
                    winStreak={row.win_streak}
                    loseStreak={row.lose_streak}
                  />
                </TableCell>
                <TableCell className="px-4 py-3">
                  <BestStreakCell value={row.best_streak} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
