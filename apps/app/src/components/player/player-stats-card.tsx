"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@v1/ui/card";
import { useTRPC } from "@/trpc/react";

interface PlayerStatsCardProps {
  puuid: string;
}

function statRow(label: string, value: string | number) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function winrate(wins: number | null, losses: number | null): string {
  if (wins == null || losses == null) return "—";
  const total = wins + losses;
  if (total === 0) return "0%";
  return `${Math.round((wins / total) * 100)}%`;
}

function formatKda(
  kills: number | null,
  deaths: number | null,
  assists: number | null,
): string {
  const k = (kills ?? 0).toFixed(1);
  const d = (deaths ?? 0).toFixed(1);
  const a = (assists ?? 0).toFixed(1);
  return `${k} / ${d} / ${a}`;
}

function kdaRatio(
  kills: number | null,
  deaths: number | null,
  assists: number | null,
): string {
  const ratio = ((kills ?? 0) + (assists ?? 0)) / Math.max(deaths ?? 1, 1);
  return `${ratio.toFixed(2)}:1`;
}

export function PlayerStatsCard({ puuid }: PlayerStatsCardProps) {
  const trpc = useTRPC();
  const { data: stats } = useSuspenseQuery(
    trpc.players.profileStats.queryOptions({ puuid }),
  );

  if (!stats) return null;

  const wins = stats.wins ?? 0;
  const losses = stats.losses ?? 0;
  const total = wins + losses;

  return (
    <Card className="ring-0 rounded-sm">
      <CardHeader className="pb-2">
        <CardTitle>Leaderboard Stats</CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-border/40">
        {statRow("Games Played", total)}
        {statRow(
          "Win Rate",
          `${winrate(wins, losses)} (${wins}W / ${losses}L)`,
        )}
        {statRow(
          "KDA",
          `${kdaRatio(stats.avg_kills, stats.avg_deaths, stats.avg_assists)} — ${formatKda(stats.avg_kills, stats.avg_deaths, stats.avg_assists)}`,
        )}
        {statRow("Avg CS", (stats.avg_cs ?? 0).toFixed(1))}
        {statRow("MVPs", stats.mvp_games ?? 0)}
        {statRow("ACEs", stats.ace_games ?? 0)}
        {statRow("Rating", Math.round(stats.rating ?? 0))}
      </CardContent>
    </Card>
  );
}
