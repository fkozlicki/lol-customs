"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

/** A match list with nothing in it yet, and what to do about it, if anything. */
export function MatchListEmpty({ action }: { action?: ReactNode }) {
  const t = useTranslations("match");

  return (
    <div className="flex flex-col items-start gap-4 py-10">
      <p className="text-sm text-muted-foreground">{t("noMatchesYet")}</p>
      {action}
    </div>
  );
}
