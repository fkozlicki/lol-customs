"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "../../utils/cn";
import { SectionHeading } from "../section-heading";
import type { SeasonSummaryView } from "./player-view";

/** The player's rating and record in every season they played, newest first. */
export function PlayerSeasonSummaries({
  summaries,
}: {
  summaries: SeasonSummaryView[];
}) {
  const t = useTranslations("season");

  if (summaries.length === 0) return null;

  return (
    <section>
      <SectionHeading>{t("summariesTitle")}</SectionHeading>
      <div className="divide-y">
        {summaries.map((summary) => (
          <Link
            key={summary.key}
            href={summary.href}
            className={cn(
              "flex items-center justify-between py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
              summary.active && "text-foreground",
            )}
          >
            <span className="label-caps text-inherit">
              {t("label", { number: summary.seasonNumber })}
            </span>
            <span className="flex items-center gap-3">
              <span className="num text-xs">
                {t("summaryRecord", {
                  wins: summary.wins,
                  losses: summary.losses,
                })}{" "}
                · {summary.winrate}
              </span>
              <span className="num font-semibold text-foreground">
                {summary.rating}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
