"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "../../components/button";

interface HallOfFameEmptyProps {
  qualificationMatches: number;
  /** Offered when there is one: the season before, which may have titles. */
  previousSeason?: { seasonNumber: number; href: string } | null;
  /** Offered on a season's page; absent on the all-time one, which has nowhere further to go. */
  allSeasonsHref?: string | null;
}

/** Early in a season nobody is qualified yet; point to a track that has titles instead of empty tables. */
export function HallOfFameEmpty({
  qualificationMatches,
  previousSeason,
  allSeasonsHref,
}: HallOfFameEmptyProps) {
  const t = useTranslations("hallOfFame");
  const tSeason = useTranslations("season");

  return (
    <section className="flex flex-col items-start gap-5 py-6">
      <div className="space-y-2">
        <p className="text-xl font-semibold tracking-[-0.02em] sm:text-2xl">
          {t("emptyTitle")}
        </p>
        <p className="text-sm text-muted-foreground">
          {t("emptyHint", { count: qualificationMatches })}
        </p>
      </div>
      {(previousSeason || allSeasonsHref) && (
        <div className="flex flex-wrap gap-2">
          {previousSeason && (
            <Button asChild variant="outline" size="sm">
              <Link href={previousSeason.href}>
                {t("showSeason", { number: previousSeason.seasonNumber })}
              </Link>
            </Button>
          )}
          {allSeasonsHref && (
            <Button asChild variant="ghost" size="sm">
              <Link href={allSeasonsHref}>{tSeason("showAllTime")}</Link>
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
