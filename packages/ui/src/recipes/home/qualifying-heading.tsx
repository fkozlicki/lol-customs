"use client";

import { useTranslations } from "next-intl";

/** The row that splits the ranked players from those still qualifying, and says when they join. */
export function QualifyingHeading({
  qualificationMatches,
}: {
  qualificationMatches: number;
}) {
  const t = useTranslations("standings");

  return (
    <tr>
      <td colSpan={9} className="px-4 pt-10 pb-3 sm:px-0">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="label-caps text-foreground">
            {t("qualifyingTitle")}
          </span>
          <span className="text-xs text-muted-foreground">
            {t("qualifyingHint", { count: qualificationMatches })}
          </span>
        </div>
      </td>
    </tr>
  );
}
