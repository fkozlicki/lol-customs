"use client";

import { SidebarTrigger } from "@v1/ui/sidebar";
import { TooltipProvider } from "@v1/ui/tooltip";
import { LocaleSwitcher } from "@/components/dashboard/locale-switcher";
import { ThemeSwitcher } from "@/components/dashboard/theme-switcher";

export function AppHeader() {
  return (
    <TooltipProvider>
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
        <SidebarTrigger />
        <div className="flex-1" />
        <div className="flex items-center gap-1">
          <ThemeSwitcher />
          <LocaleSwitcher />
        </div>
      </header>
    </TooltipProvider>
  );
}
