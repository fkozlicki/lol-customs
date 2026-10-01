import { PageHeader } from "@v1/ui/recipes/page-header";
import { PageShell } from "@v1/ui/recipes/page-shell";
import { getTranslations } from "next-intl/server";
import { AuctionSetupForm } from "@/components/auctions/auction-setup-form";

export default async function NewAuctionPage() {
  const t = await getTranslations("dashboard.pages.auctions");

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
