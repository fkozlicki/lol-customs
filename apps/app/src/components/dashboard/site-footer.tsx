import { getScopedI18n } from "@/locales/server";

/**
 * The foot of every dashboard page. Its one job for now is Riot's attribution notice, which the
 * developer policy requires "in a location that is readily visible to players" of any product built
 * on their games and data. The wording is Riot's, verbatim, with the product name filled in.
 *
 * Small muted prose rather than `label-caps`: it is two sentences, not a label, and DESIGN.md keeps
 * prose in Geist Sans. The rule runs the full width of the window, like the top bar's; the text runs
 * the width of the page. The bottom padding clears the fixed mobile navigation.
 */
export async function SiteFooter() {
  const t = await getScopedI18n("dashboard.footer");

  return (
    <footer className="border-t">
      <p className="mx-auto w-full max-w-6xl px-4 pt-6 pb-24 text-xs text-muted-foreground md:pb-10">
        {t("riotNotice")}
      </p>
    </footer>
  );
}
