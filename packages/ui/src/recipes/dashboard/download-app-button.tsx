"use client";

import { useTranslations } from "next-intl";
import { Button } from "../../components/button";
import { Icons } from "../icons";

/** Derby Sync is how matches reach the ladder; offered wherever matches are missing or listed. */
export function DownloadAppButton({ onClick }: { onClick: () => void }) {
  const t = useTranslations("download");

  return (
    <Button variant="outline" size="sm" onClick={onClick}>
      <Icons.Download className="size-3.5" />
      {t("button")}
    </Button>
  );
}
