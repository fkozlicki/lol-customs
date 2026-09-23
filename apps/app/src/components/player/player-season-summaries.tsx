"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { formatWinrate } from "@v1/domain/stats";
import { cn } from "@v1/ui/cn";
import Link from "next/link";
import { SectionHeading } from "@/components/page-header";
import { useScopedI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/react";
import { SEASON_PARAM, type SeasonOption } from "@/utils/season";

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
    <section>
      <SectionHeading>{t("summariesTitle")}</SectionHeading>
      <div className="divide-y">
        {[...summaries].reverse().map((summary) => {
          const number =
            seasons.find((s) => s.id === summary.seasonId)?.number ??
            summary.seasonId;
          return (
            <Link
              key={summary.seasonId}
              href={`?${SEASON_PARAM}=${summary.seasonId}`}
              className={cn(
                "flex items-center justify-between py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
                summary.seasonId === season && "text-foreground",
              )}
            >
              <span className="label-caps text-inherit">
                {t("label", { number })}
              </span>
              <span className="flex items-center gap-3">
                <span className="num text-xs">
                  {t("summaryRecord", {
                    wins: summary.wins,
                    losses: summary.losses,
                  })}{" "}
                  · {formatWinrate(summary.wins, summary.losses)}
                </span>
                <span className="num font-semibold text-foreground">
                  {Math.round(summary.rating ?? 0)}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
