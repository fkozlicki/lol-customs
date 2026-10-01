"use client";

import { useTranslations } from "next-intl";

/** The list could not be loaded; the app offers a way to try again through `action`. */
export function AuctionListError({ action }: { action?: React.ReactNode }) {
  const t = useTranslations("auctions");

  return (
    <div className="flex flex-col items-start gap-4 py-10">
      <p className="text-sm text-muted-foreground">{t("errors.load")}</p>
      {action}
    </div>
  );
}
