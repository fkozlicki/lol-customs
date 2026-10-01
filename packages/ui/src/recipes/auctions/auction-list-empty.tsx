"use client";

import { useTranslations } from "next-intl";

/** No lobby and no live auction: invite the visitor to open one, with the action the app offers. */
export function AuctionListEmpty({ action }: { action?: React.ReactNode }) {
  const t = useTranslations("auctions.list");

  return (
    <div className="flex flex-col items-start gap-4">
      <p className="text-2xl font-semibold uppercase tracking-[-0.03em] sm:text-3xl">
        {t("emptyTitle")}
      </p>
      <p className="max-w-md text-sm text-muted-foreground">
        {t("emptyDescription")}
      </p>
      {action}
    </div>
  );
}
