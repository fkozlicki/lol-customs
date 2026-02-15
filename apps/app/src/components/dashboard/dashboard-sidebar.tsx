"use client";

import { Icons } from "@v1/ui/icons";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@v1/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { env } from "@/env.mjs";

interface DashboardSidebarProps {
  locale: string;
  children: React.ReactNode;
}

export function DashboardSidebar({ locale, children }: DashboardSidebarProps) {
  const pathname = usePathname();
  const base = `/${locale}`;

  return (
    <SidebarProvider>
      <Sidebar>
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
          {env.NEXT_PUBLIC_LCU_DOWNLOAD_URL && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild variant="primary">
                <a
                  href={env.NEXT_PUBLIC_LCU_DOWNLOAD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icons.Download className="size-4" />
                  <span>Download desktop app</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarFooter>
      </Sidebar>
      {children}
    </SidebarProvider>
  );
}
