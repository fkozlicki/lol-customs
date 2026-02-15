"use client";

import type { RouterOutputs } from "@v1/api";
import { Card, CardContent, CardHeader, CardTitle } from "@v1/ui/card";
import { useSuspenseQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTRPC } from "@/trpc/react";

type LeaderboardRow = RouterOutputs["ladder"]["leaderboard"][number];

function winrate(wins: number | null, losses: number | null): string {
  if (wins == null || losses == null) return "—";
  const total = wins + losses;
  if (total === 0) return "0%";
  return `${Math.round((wins / total) * 100)}%`;
}

interface LeaderboardProps {
  limit?: number;
}

export function Leaderboard({ limit = 50 }: LeaderboardProps) {
  const params = useParams();
  const locale = (params?.locale as string) ?? "en";
  const trpc = useTRPC();
  const { data: leaderboard } = useSuspenseQuery(
    trpc.ladder.leaderboard.queryOptions({ limit }),
  );

  if (!leaderboard?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No players yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Leaderboard</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground border-b text-left">
                <th className="pb-2 font-medium">#</th>
                <th className="pb-2 font-medium">Player</th>
                <th className="pb-2 font-medium text-right">Rating</th>
                <th className="pb-2 font-medium text-right">W/L</th>
                <th className="pb-2 font-medium text-right">WR</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((row: LeaderboardRow, index: number) => {
                const name =
                  row.player?.game_name && row.player?.tag_line
                    ? `${row.player.game_name}#${row.player.tag_line}`
                    : row.puuid.slice(0, 8);
                return (
                  <tr
                    key={row.puuid}
                    className="border-b border-border/50 last:border-0"
                  >
                    <td className="text-muted-foreground py-2 tabular-nums">
                      {index + 1}
                    </td>
                    <td className="py-2">
                      <Link
                        href={`/${locale}/players/${encodeURIComponent(row.puuid)}`}
                        className="hover:text-primary font-medium"
                      >
                        {name}
                      </Link>
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      {row.rating ?? "—"}
                    </td>
                    <td className="text-muted-foreground py-2 text-right tabular-nums">
                      {row.wins ?? 0}/{row.losses ?? 0}
                    </td>
                    <td className="text-muted-foreground py-2 text-right tabular-nums">
                      {winrate(row.wins, row.losses)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
