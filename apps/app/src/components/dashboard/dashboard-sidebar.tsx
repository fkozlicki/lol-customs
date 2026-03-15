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
import { PATHS } from "./nav";

interface DashboardSidebarProps {
  locale: string;
  children: React.ReactNode;
}

export function DashboardSidebar({ children }: DashboardSidebarProps) {
  const t = useScopedI18n("dashboard");
  const pathname = usePathname();
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);

  const checkIfActivePath = (path: string): boolean => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  return (
    <>
      <Dialog open={downloadDialogOpen} onOpenChange={setDownloadDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("download.title")}</DialogTitle>
            <DialogDescription>{t("download.description")}</DialogDescription>
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
            <Button asChild variant="outline" size="lg" className="w-full">
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
      <SidebarProvider>
        <Sidebar className="lg:flex">
          <SidebarHeader>
            <span className="font-semibold text-foreground">
              {t("sidebar.appName")}
            </span>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {PATHS.map(({ path, label, Icon }) => (
                    <SidebarMenuItem key={path}>
                      <SidebarMenuButton
                        asChild
                        isActive={checkIfActivePath(path)}
                      >
                        <Link href={path} prefetch={true}>
                          <Icon className="size-4" />
                          <span>{t(label)}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenuItem>
              <SidebarMenuButton
                variant="primary"
                onClick={() => setDownloadDialogOpen(true)}
              >
                <Icons.Download className="size-4" />
                <span>{t("sidebar.downloadDesktopApp")}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarFooter>
        </Sidebar>
        {children}
      </SidebarProvider>
    </>
  );
}
