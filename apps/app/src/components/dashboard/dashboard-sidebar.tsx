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

interface DashboardSidebarProps {
  locale: string;
  children: React.ReactNode;
}

const hasInstaller = Boolean(env.NEXT_PUBLIC_LCU_DOWNLOAD_URL);
const hasZip = Boolean(env.NEXT_PUBLIC_LCU_DOWNLOAD_ZIP_URL);
const hasBoth = hasInstaller && hasZip;
const hasAnyDownload = hasInstaller || hasZip;

export function DashboardSidebar({ locale, children }: DashboardSidebarProps) {
  const pathname = usePathname();
  const base = `/${locale}`;
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <SidebarMenuButton asChild>
            <Link href={base}>
              <span className="font-semibold text-foreground">Rift Rank</span>
            </Link>
          </SidebarMenuButton>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === base}>
                    <Link href={base}>
                      <Icons.Leaderboard className="size-4" />
                      <span>Leaderboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === `${base}/matches`}
                  >
                    <Link href={`${base}/matches`}>
                      <Icons.Calendar className="size-4" />
                      <span>Match history</span>
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
                    variant="primary"
                    onClick={() => setDownloadDialogOpen(true)}
                  >
                    <Icons.Download className="size-4" />
                    <span>Download desktop app</span>
                  </SidebarMenuButton>
                  <Dialog
                    open={downloadDialogOpen}
                    onOpenChange={setDownloadDialogOpen}
                  >
                    <DialogContent className="max-w-sm">
                      <DialogHeader>
                        <DialogTitle>Download Rift Rank LCU</DialogTitle>
                        <DialogDescription>
                          Choose the format you prefer.
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
                            Installer (.exe)
                          </a>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="w-full">
                          <a
                            href={env.NEXT_PUBLIC_LCU_DOWNLOAD_ZIP_URL!}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setDownloadDialogOpen(false)}
                          >
                            ZIP (portable)
                          </a>
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </>
              ) : (
                <SidebarMenuButton asChild variant="primary">
                  <a
                    href={
                      env.NEXT_PUBLIC_LCU_DOWNLOAD_URL ??
                      env.NEXT_PUBLIC_LCU_DOWNLOAD_ZIP_URL!
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Icons.Download className="size-4" />
                    <span>Download desktop app</span>
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
