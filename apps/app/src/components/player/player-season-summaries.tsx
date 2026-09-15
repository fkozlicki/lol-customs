"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@v1/ui/card";
import { cn } from "@v1/ui/cn";
import Link from "next/link";
import { useScopedI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/react";
import { SEASON_PARAM, type SeasonOption } from "@/utils/season";
import { formatWinrate } from "@/utils/stats";

interface PlayerSeasonSummariesProps {
  puuid: string;
  season: number;
  seasons: SeasonOption[];
}

export function PlayerSeasonSummaries({
  puuid,
  season,
  seasons,
}: PlayerSeasonSummariesProps) {
  const t = useScopedI18n("dashboard.season");
  const trpc = useTRPC();
  const { data: summaries } = useSuspenseQuery(
    trpc.players.seasonSummaries.queryOptions({ puuid }),
  );

  if (summaries.length === 0) return null;

  return (
    <Card className="ring-0 rounded-sm">
      <CardHeader className="pb-2">
        <CardTitle>{t("summariesTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-border/40">
        {[...summaries].reverse().map((summary) => {
          const number =
            seasons.find((s) => s.id === summary.seasonId)?.number ??
            summary.seasonId;
          return (
            <Link
              key={summary.seasonId}
              href={`?${SEASON_PARAM}=${summary.seasonId}`}
              className={cn(
                "flex items-center justify-between py-1.5 text-sm hover:underline underline-offset-2",
                summary.seasonId === season && "font-semibold",
              )}
            >
              <span className="text-muted-foreground">
                {t("label", { number })}
              </span>
              <span className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {t("summaryRecord", {
                    wins: summary.wins,
                    losses: summary.losses,
                  })}{" "}
                  · {formatWinrate(summary.wins, summary.losses)}
                </span>
                <span className="font-medium tabular-nums">
                  {Math.round(summary.rating ?? 0)}
                </span>
              </span>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
