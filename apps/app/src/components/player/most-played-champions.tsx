"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@v1/ui/card";
import { ChampionImage } from "@/components/game-assets/champion-image";
import { useTRPC } from "@/trpc/react";

interface MostPlayedChampionsProps {
  puuid: string;
}

function winrate(wins: number, games: number): string {
  if (games === 0) return "0%";
  return `${Math.round((wins / games) * 100)}%`;
}

function kda(
  kills: number,
  deaths: number,
  assists: number,
  games: number,
): string {
  if (games === 0) return "—";
  const k = (kills / games).toFixed(1);
  const d = (deaths / games).toFixed(1);
  const a = (assists / games).toFixed(1);
  return `${k} / ${d} / ${a}`;
}

export function MostPlayedChampions({ puuid }: MostPlayedChampionsProps) {
  const trpc = useTRPC();
  const { data: champions } = useSuspenseQuery(
    trpc.players.mostPlayedChampions.queryOptions({ puuid, limit: 5 }),
  );

  if (!champions || champions.length === 0) {
    return (
      <Card className="ring-0 rounded-sm">
        <CardHeader className="pb-2">
          <CardTitle>Most Played Champions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No data available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="ring-0 rounded-sm">
      <CardHeader className="pb-2">
        <CardTitle>Most Played Champions</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-border/40">
          {champions.map((champ) => (
            <li
              key={champ.championId}
              className="flex items-center gap-3 py-2 first:pt-0 last:pb-0"
            >
              <ChampionImage
                championId={champ.championId}
                width={36}
                height={36}
                className="rounded-full shrink-0"
              />
              <div className="flex flex-1 items-center justify-between gap-2 min-w-0">
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium truncate">
                    {champ.games} {champ.games === 1 ? "game" : "games"}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {kda(champ.kills, champ.deaths, champ.assists, champ.games)}
                  </span>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <span className="text-sm font-semibold">
                    {winrate(champ.wins, champ.games)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {champ.wins}W {champ.games - champ.wins}L
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
