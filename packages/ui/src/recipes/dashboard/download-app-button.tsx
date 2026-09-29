"use client";

import { Button } from "../../components/button";
import { useRecipesI18n } from "../i18n/i18n";
import { Icons } from "../icons";

/** Derby Sync is how matches reach the ladder; offered wherever matches are missing or listed. */
export function DownloadAppButton({ onClick }: { onClick: () => void }) {
  const t = useRecipesI18n("download");

  return (
    <Button variant="outline" size="sm" onClick={onClick}>
      <Icons.Download className="size-3.5" />
      {t("button")}
    </Button>
  );
}
