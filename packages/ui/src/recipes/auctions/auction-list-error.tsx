"use client";

import { useTranslations } from "next-intl";
import { Button } from "../../components/button";

/** The list could not be loaded; offer to try again. */
export function AuctionListError({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations("auctions");

  return (
    <div className="flex flex-col items-start gap-4 py-10">
      <p className="text-sm text-muted-foreground">{t("errors.load")}</p>
      <Button variant="outline" onClick={onRetry}>
        {t("actions.retry")}
      </Button>
    </div>
  );
}
