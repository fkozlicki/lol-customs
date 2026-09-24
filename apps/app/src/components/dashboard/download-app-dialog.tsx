"use client";

import { Button } from "@v1/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@v1/ui/dialog";
import { Icons } from "@/components/icons";
import { env } from "@/env.mjs";
import { useScopedI18n } from "@/locales/client";
import { useDownloadDialog } from "./use-download-dialog";

export function DownloadAppDialog() {
  const t = useScopedI18n("dashboard.download");
  const [open, setOpen] = useDownloadDialog();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Button asChild size="lg" className="w-full">
            <a
              href={env.NEXT_PUBLIC_LCU_DOWNLOAD_URL!}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
            >
              <Icons.Download className="size-4" />
              {t("installerExe")}
            </a>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full">
            <a
              href={env.NEXT_PUBLIC_LCU_DOWNLOAD_ZIP_URL!}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
            >
              {t("zipPortable")}
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
