import { PageHeader } from "@v1/ui/recipes/page-header";
import { getTranslations } from "next-intl/server";
import { AuctionLiveBadge } from "./auction-live-badge";
import { CreateAuctionButton } from "./create-auction-button";

/** The auction list's title, how it keeps up, and the way to open a new auction. */
export async function AuctionsHeader() {
  const t = await getTranslations("dashboard.pages.auctions");

  return (
    <PageHeader title={t("title")} description={t("description")}>
      <div className="flex items-center gap-4">
        <AuctionLiveBadge />
        <CreateAuctionButton />
      </div>
    </PageHeader>
  );
}
