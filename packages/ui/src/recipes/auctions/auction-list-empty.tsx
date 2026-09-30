"use client";

import { useTranslations } from "next-intl";
import { CreateAuctionButton } from "./create-auction-button";

interface AuctionListEmptyProps {
  onCreate: () => void;
  createDisabled?: boolean;
}

/** No lobby and no live auction: invite the visitor to open one. */
export function AuctionListEmpty({
  onCreate,
  createDisabled,
}: AuctionListEmptyProps) {
  const t = useTranslations("auctions.list");

  return (
    <div className="flex flex-col items-start gap-4">
      <p className="text-2xl font-semibold uppercase tracking-[-0.03em] sm:text-3xl">
        {t("emptyTitle")}
      </p>
      <p className="max-w-md text-sm text-muted-foreground">
        {t("emptyDescription")}
      </p>
      <CreateAuctionButton
        variant="outline"
        onClick={onCreate}
        disabled={createDisabled}
      />
    </div>
  );
}
