"use client";

import { createClient } from "@v1/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@v1/ui/avatar";
import { Button } from "@v1/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@v1/ui/dropdown-menu";
import { Icons } from "@v1/ui/icons";
import { SidebarTrigger } from "@v1/ui/sidebar";
import { TooltipProvider } from "@v1/ui/tooltip";
import { useUser } from "@/components/auth/user-context";
import { LocaleSwitcher } from "@/components/dashboard/locale-switcher";
import { ThemeSwitcher } from "@/components/dashboard/theme-switcher";
import { useScopedI18n } from "@/locales/client";

export function AppHeader() {
  const { profile, isLoading, openSignInDialog } = useUser();
  const t = useScopedI18n("dashboard.auth");
  const tSidebar = useScopedI18n("dashboard.sidebar");

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
  }

  return (
    <TooltipProvider>
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-background px-4 sticky top-0 z-10">
        <SidebarTrigger className="hidden md:block" />
        <span className="font-semibold text-foreground md:hidden">
          {tSidebar("appName")}
        </span>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <LocaleSwitcher />
          {!isLoading &&
            (profile ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full size-8 p-0"
                  >
                    <Avatar className="size-7">
                      <AvatarImage
                        src={profile.avatar_url ?? undefined}
                        alt={profile.nickname}
                      />
                      <AvatarFallback className="text-xs font-semibold">
                        {profile.nickname[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{profile.nickname}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("anonymousUser")}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-destructive focus:text-destructive"
                  >
                    <Icons.LogOut className="mr-2 size-4" />
                    {t("signOut")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button size="sm" className="gap-1.5" onClick={openSignInDialog}>
                {t("signIn")}
              </Button>
            ))}
        </div>
      </header>
    </TooltipProvider>
  );
}
