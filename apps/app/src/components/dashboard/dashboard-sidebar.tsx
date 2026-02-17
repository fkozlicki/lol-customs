"use client";

import { Button } from "@v1/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@v1/ui/dialog";
import { Icons } from "@v1/ui/icons";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@v1/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { env } from "@/env.mjs";
import { useScopedI18n } from "@/locales/client";

interface DashboardSidebarProps {
  locale: string;
  children: React.ReactNode;
}

const hasInstaller = Boolean(env.NEXT_PUBLIC_LCU_DOWNLOAD_URL);
const hasZip = Boolean(env.NEXT_PUBLIC_LCU_DOWNLOAD_ZIP_URL);
const hasBoth = hasInstaller && hasZip;
const hasAnyDownload = hasInstaller || hasZip;

export function DashboardSidebar({ locale, children }: DashboardSidebarProps) {
  const t = useScopedI18n("dashboard");
  const pathname = usePathname();
  const base = `/${locale}`;
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(\/|$)/, "$1") || "/";
  const isLeaderboardActive =
    pathWithoutLocale === "/" || pathWithoutLocale === "";
  const isMatchesActive = pathWithoutLocale === "/matches";

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <span className="font-semibold text-foreground">
            {t("sidebar.appName")}
          </span>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isLeaderboardActive}>
                    <Link href={base}>
                      <Icons.Leaderboard className="size-4" />
                      <span>{t("sidebar.leaderboard")}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isMatchesActive}>
                    <Link href={`${base}/matches`}>
                      <Icons.Calendar className="size-4" />
                      <span>{t("sidebar.matchHistory")}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          {hasAnyDownload && (
            <SidebarMenuItem>
              {hasBoth ? (
                <>
                  <SidebarMenuButton
                    onClick={() => setDownloadDialogOpen(true)}
                  >
                    <Icons.Download className="size-4" />
                    <span>{t("sidebar.downloadDesktopApp")}</span>
                  </SidebarMenuButton>
                  <Dialog
                    open={downloadDialogOpen}
                    onOpenChange={setDownloadDialogOpen}
                  >
                    <DialogContent className="max-w-sm">
                      <DialogHeader>
                        <DialogTitle>{t("download.title")}</DialogTitle>
                        <DialogDescription>
                          {t("download.description")}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex flex-col gap-2">
                        <Button asChild size="lg" className="w-full">
                          <a
                            href={env.NEXT_PUBLIC_LCU_DOWNLOAD_URL!}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setDownloadDialogOpen(false)}
                          >
                            <Icons.Download className="size-4" />
                            {t("download.installerExe")}
                          </a>
                        </Button>
                        <Button
                          asChild
                          variant="outline"
                          size="lg"
                          className="w-full"
                        >
                          <a
                            href={env.NEXT_PUBLIC_LCU_DOWNLOAD_ZIP_URL!}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setDownloadDialogOpen(false)}
                          >
                            {t("download.zipPortable")}
                          </a>
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </>
              ) : (
                <SidebarMenuButton asChild>
                  <a
                    href={
                      env.NEXT_PUBLIC_LCU_DOWNLOAD_URL ??
                      env.NEXT_PUBLIC_LCU_DOWNLOAD_ZIP_URL!
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Icons.Download className="size-4" />
                    <span>{t("sidebar.downloadDesktopApp")}</span>
                  </a>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          )}
        </SidebarFooter>
      </Sidebar>
      {children}
    </SidebarProvider>
  );
}
