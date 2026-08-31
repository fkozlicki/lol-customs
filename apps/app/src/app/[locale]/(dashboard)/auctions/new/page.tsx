import { AuctionSetupForm } from "@/components/auctions/auction-setup-form";
import { getScopedI18n } from "@/locales/server";

export default async function NewAuctionPage() {
  const t = await getScopedI18n("dashboard.pages.auctions");
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-500">
          {t("creator.eyebrow")}
        </p>
        <h1 className="mt-1 text-2xl font-semibold">{t("creator.title")}</h1>
        <p className="mt-1 max-w-2xl text-muted-foreground">
          {t("creator.description")}
        </p>
      </div>
      <AuctionSetupForm />
    </div>
  );
}
