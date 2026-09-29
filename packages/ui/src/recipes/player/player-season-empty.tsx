"use client";

import Link from "next/link";
import { Button } from "../../components/button";
import { useRecipesI18n } from "../i18n/i18n";

interface PlayerSeasonEmptyProps {
  seasonNumber: number;
  /** Where "show all seasons" goes; the app builds it, because the season lives in its URL. */
  allSeasonsHref: string;
}

export function PlayerSeasonEmpty({
  seasonNumber,
  allSeasonsHref,
}: PlayerSeasonEmptyProps) {
  const t = useRecipesI18n("season");

  return (
    <section className="flex flex-col items-start gap-3">
      <p className="text-2xl font-semibold uppercase tracking-[-0.02em]">
        {t("emptyPlayerTitle", { number: seasonNumber })}
      </p>
      <p className="text-sm text-muted-foreground">
        {t("emptyPlayerDescription")}
      </p>
      <Button asChild size="sm" variant="outline">
        <Link href={allSeasonsHref}>{t("showAllTime")}</Link>
      </Button>
    </section>
  );
}
