"use client";

import { useTranslations } from "next-intl";

/** A part of a page could not be loaded; the app offers a way to try again through `action`. */
export function QueryError({ action }: { action?: React.ReactNode }) {
  const t = useTranslations("loadError");

  return (
    <div className="flex flex-col items-start gap-4 py-10">
      <p className="text-sm text-muted-foreground">{t("message")}</p>
      {action}
    </div>
  );
}
