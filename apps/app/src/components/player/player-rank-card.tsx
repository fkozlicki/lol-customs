"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@v1/ui/card";
import Image from "next/image";
import { useTRPC } from "@/trpc/react";
import { rankEmblemUrl } from "@/utils/asset-urls";

interface PlayerRankCardProps {
  gameName: string;
  tagLine: string;
  platformId: string;
}

function formatRank(tier: string, rank: string): string {
  const apex = ["MASTER", "GRANDMASTER", "CHALLENGER"];
  if (apex.includes(tier.toUpperCase())) return tier;
  return `${tier} ${rank}`;
}

export function PlayerRankCard({
  gameName,
  tagLine,
  platformId,
}: PlayerRankCardProps) {
  const trpc = useTRPC();
  const { data: entries } = useSuspenseQuery(
    trpc.riot.getPlayerRankByRiotId.queryOptions({
      gameName,
      tagLine,
      platformId,
    }),
  );

  const soloQ = entries?.find((e) => e.queueType === "RANKED_SOLO_5x5");

  if (!soloQ) {
    return (
      <Card className="ring-0 rounded-sm">
        <CardHeader className="pb-2">
          <CardTitle>Ranked Solo/Duo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="relative w-16 h-16 shrink-0 overflow-hidden">
              <div className="w-full h-full bg-muted rounded-full" />
            </div>
            <span className="text-sm text-muted-foreground">Unranked</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const tier = soloQ.tier ?? "";
  const rank = soloQ.rank ?? "";
  const lp = soloQ.leaguePoints ?? 0;
  const wins = soloQ.wins ?? 0;
  const losses = soloQ.losses ?? 0;
  const total = wins + losses;
  const wr = total > 0 ? Math.round((wins / total) * 100) : 0;

  return (
    <Card className="ring-0 rounded-sm">
      <CardHeader className="pb-2">
        <CardTitle>Ranked Solo/Duo</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <div className="relative w-16 h-16 shrink-0 overflow-hidden">
            <Image
              src={rankEmblemUrl(tier)}
              alt={tier}
              fill
              className="object-cover scale-200"
              unoptimized
            />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-base leading-tight">
              {formatRank(tier, rank)}
            </span>
            <span className="text-sm text-muted-foreground">{lp} LP</span>
            <span className="text-xs text-muted-foreground mt-0.5">
              {wins}W / {losses}L — {wr}% WR
            </span>
          </div>
        </div>
        {soloQ.hotStreak && (
          <p className="mt-2 text-xs font-medium text-orange-500">
            🔥 Hot Streak
          </p>
        )}
      </CardContent>
    </Card>
  );
}
