"use client";

import { Button } from "@v1/ui/button";
import { Icons } from "@/components/icons";
import { useScopedI18n } from "@/locales/client";
import { useDownloadDialog } from "./use-download-dialog";

/** Derby Sync is how matches reach the ladder; offered wherever matches are missing or listed. */
export function DownloadAppButton() {
  const t = useScopedI18n("dashboard.sidebar");
  const [, setOpen] = useDownloadDialog();

  return (
    <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
      <Icons.Download className="size-3.5" />
      {t("downloadDesktopApp")}
    </Button>
  );
}
