"use client";

import { useTranslations } from "next-intl";
import { Button } from "../../components/button";

/** The viewer captains an auction that is live, so they cannot open another until it ends. */
export function LiveAuctionNotice({
  onGoToAuction,
}: {
  onGoToAuction: () => void;
}) {
  const t = useTranslations("auctions.creator");

  return (
    <div className="flex flex-col items-start gap-4">
      <p className="max-w-md text-sm">{t("liveAuction")}</p>
      <Button onClick={onGoToAuction}>{t("goToAuction")}</Button>
    </div>
  );
}
