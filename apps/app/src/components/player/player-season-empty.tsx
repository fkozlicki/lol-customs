"use client";

import { Button } from "@v1/ui/button";
import Link from "next/link";
import { useScopedI18n } from "@/locales/client";
import { ALL_TIME_PARAM, SEASON_PARAM } from "@/utils/season";

export function PlayerSeasonEmpty({ seasonNumber }: { seasonNumber: number }) {
  const t = useScopedI18n("dashboard.season");

  return (
    <section className="flex flex-col items-start gap-3">
      <p className="text-2xl font-semibold uppercase tracking-[-0.02em]">
        {t("emptyPlayerTitle", { number: seasonNumber })}
      </p>
      <p className="text-sm text-muted-foreground">
        {t("emptyPlayerDescription")}
      </p>
      <Button asChild size="sm" variant="outline">
        <Link href={`?${SEASON_PARAM}=${ALL_TIME_PARAM}`}>
          {t("showAllTime")}
        </Link>
      </Button>
    </section>
  );
}
