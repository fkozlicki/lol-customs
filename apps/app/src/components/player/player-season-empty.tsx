"use client";

import { Button } from "@v1/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@v1/ui/card";
import Link from "next/link";
import { useScopedI18n } from "@/locales/client";
import { ALL_TIME_PARAM, SEASON_PARAM } from "@/utils/season";

export function PlayerSeasonEmpty({ seasonNumber }: { seasonNumber: number }) {
  const t = useScopedI18n("dashboard.season");

  return (
    <Card className="ring-0 rounded-sm">
      <CardHeader className="pb-2">
        <CardTitle>{t("emptyPlayerTitle", { number: seasonNumber })}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-start gap-3">
        <p className="text-sm text-muted-foreground">
          {t("emptyPlayerDescription")}
        </p>
        <Button asChild size="sm" variant="outline">
          <Link href={`?${SEASON_PARAM}=${ALL_TIME_PARAM}`}>
            {t("showAllTime")}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
