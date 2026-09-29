"use client";

import { DownloadAppButton as DownloadAppButtonView } from "@v1/ui/recipes/dashboard/download-app-button";
import { useDownloadDialog } from "./use-download-dialog";

/** Opens the download dialog, which lives in the query string so a link can open it too. */
export function DownloadAppButton() {
  const [, setOpen] = useDownloadDialog();
  return <DownloadAppButtonView onClick={() => setOpen(true)} />;
}
