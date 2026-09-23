import { AuctionSetupForm } from "@/components/auctions/auction-setup-form";
import { PageHeader } from "@/components/page-header";
import { getScopedI18n } from "@/locales/server";

export default async function NewAuctionPage() {
  const t = await getScopedI18n("dashboard.pages.auctions");

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-4 pt-10 pb-16 sm:pt-16">
      <PageHeader
        eyebrow={t("creator.eyebrow")}
        title={t("creator.title")}
        description={t("creator.description")}
      />
      <AuctionSetupForm />
    </div>
  );
}
