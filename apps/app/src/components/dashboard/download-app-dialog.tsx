"use client";

import { DownloadAppDialog as DownloadAppDialogView } from "@v1/ui/recipes/dashboard/download-app-dialog";
import { env } from "@/env.mjs";
import { useDownloadDialog } from "./use-download-dialog";

/** Open while `?download=true`, so any link can open it. */
export function DownloadAppDialog() {
  const [open, setOpen] = useDownloadDialog();

  return (
    <DownloadAppDialogView
      open={open}
      onOpenChange={setOpen}
      installerUrl={env.NEXT_PUBLIC_LCU_DOWNLOAD_URL!}
      zipUrl={env.NEXT_PUBLIC_LCU_DOWNLOAD_ZIP_URL!}
    />
  );
}
