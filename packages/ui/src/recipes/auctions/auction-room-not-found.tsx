"use client";

import { useTranslations } from "next-intl";
import { Button } from "../../components/button";

/** No room behind the link, or it could not be read; trying again reads it once more. */
export function AuctionRoomNotFound({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations("auctions");

  return (
    <div className="mx-auto max-w-xl p-6 text-center">
      <h1 className="text-xl font-semibold">{t("room.notFound")}</h1>
      <Button className="mt-4" variant="outline" onClick={onRetry}>
        {t("actions.retry")}
      </Button>
    </div>
  );
}
