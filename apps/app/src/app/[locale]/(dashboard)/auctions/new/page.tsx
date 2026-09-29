import { PageHeader } from "@v1/ui/recipes/page-header";
import { PageShell } from "@v1/ui/recipes/page-shell";
import { AuctionSetupForm } from "@/components/auctions/auction-setup-form";
import { getScopedI18n } from "@/locales/server";

export default async function NewAuctionPage() {
  const t = await getScopedI18n("dashboard.pages.auctions");

  return (
    <PageShell>
      <PageHeader
        eyebrow={t("creator.eyebrow")}
        title={t("creator.title")}
        description={t("creator.description")}
      />
      <AuctionSetupForm />
    </PageShell>
  );
}
