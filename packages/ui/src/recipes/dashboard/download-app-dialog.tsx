"use client";

import { useTranslations } from "next-intl";
import { Button } from "../../components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/dialog";
import { Icons } from "../icons";

interface DownloadAppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  installerUrl: string;
  zipUrl: string;
}

/** The two ways to get Derby Sync: the installer, or a portable ZIP. */
export function DownloadAppDialog({
  open,
  onOpenChange,
  installerUrl,
  zipUrl,
}: DownloadAppDialogProps) {
  const t = useTranslations("download");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Button asChild size="lg" className="w-full">
            <a
              href={installerUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onOpenChange(false)}
            >
              <Icons.Download className="size-4" />
              {t("installerExe")}
            </a>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full">
            <a
              href={zipUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onOpenChange(false)}
            >
              {t("zipPortable")}
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
