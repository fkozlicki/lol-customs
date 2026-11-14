"use client";

import { useTranslations } from "next-intl";
import { CollectorList } from "./collector-list";
import type { CollectorView } from "./hall-of-fame-view";

interface TitleCollectorsProps {
  mostBest: CollectorView[];
  mostWorst: CollectorView[];
}

/** Who collects the most best and the most worst titles: the page's opening story. */
export function TitleCollectors({ mostBest, mostWorst }: TitleCollectorsProps) {
  const t = useTranslations("hallOfFame");

  return (
    <div className="grid gap-10 md:grid-cols-2 md:gap-12">
      <CollectorList label={t("mostBest")} rows={mostBest} filled />
      <CollectorList
        label={t("mostWorst")}
        rows={mostWorst}
        className="md:justify-self-end"
      />
    </div>
  );
}
