"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "../../components/card";
import { Icons } from "../icons";

/** Above the final rosters, once every player is sold. */
export function AuctionCompletedBanner() {
  const t = useTranslations("auctions.terminal");

  return (
    <Card>
      <CardContent className="py-8 text-center">
        <Icons.Trophy className="mx-auto mb-3 size-10 text-muted-foreground" />
        <h2 className="text-2xl font-semibold">{t("completedTitle")}</h2>
        <p className="text-muted-foreground">{t("completedDescription")}</p>
      </CardContent>
    </Card>
  );
}
