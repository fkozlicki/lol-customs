"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "../../components/card";
import { Icons } from "../icons";

/** A room that will not resume: the creator cancelled it, or it sat idle until it expired. */
export function AuctionRoomClosed({
  status,
}: {
  status: "cancelled" | "expired";
}) {
  const t = useTranslations("auctions.terminal");

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardContent className="py-16 text-center">
          <Icons.Auction className="mx-auto mb-4 size-10 text-muted-foreground" />
          <h1 className="text-xl font-semibold">{t(`${status}Title`)}</h1>
          <p className="mt-2 text-muted-foreground">
            {t(`${status}Description`)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
