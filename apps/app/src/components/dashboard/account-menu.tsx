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
import { useUser } from "@/components/auth/user-context";
import { useScopedI18n } from "@/locales/client";

export function AccountMenu() {
  const { profile, isLoading, openSignInDialog } = useUser();
  const t = useScopedI18n("dashboard.auth");

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
  }

  if (isLoading) return null;

  if (!profile) {
    return (
      <Button size="sm" variant="outline" onClick={openSignInDialog}>
        {t("signIn")}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="p-0">
          <Avatar className="size-7 rounded-none">
            <AvatarImage
              src={profile.avatar_url ?? undefined}
              alt={profile.nickname}
              className="rounded-none"
            />
            <AvatarFallback className="rounded-none text-xs font-semibold">
              {profile.nickname[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{profile.nickname}</p>
          <p className="label-caps">{t("anonymousUser")}</p>
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
  );
}
