"use client";

import { createClient } from "@v1/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@v1/ui/avatar";
import { Button } from "@v1/ui/button";
import { cn } from "@v1/ui/cn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@v1/ui/dropdown-menu";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useUser } from "@/components/auth/user-context";
import { Icons } from "@/components/icons";
import { SUPPORTED_LOCALES } from "@/locales";
import {
  useChangeLocale,
  useCurrentLocale,
  useScopedI18n,
} from "@/locales/client";
import { useDownloadDialog } from "./use-download-dialog";

const THEMES = ["system", "light", "dark"] as const;

/** Account, theme, language and Derby Sync download behind one button. */
export function AccountMenu() {
  const { profile, isLoading, openSignInDialog } = useUser();
  const t = useScopedI18n("dashboard");
  const [, setDownloadOpen] = useDownloadDialog();
  const { theme, setTheme } = useTheme();
  const locale = useCurrentLocale();
  const changeLocale = useChangeLocale({ preserveSearchParams: true });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label={t("preferences.menuLabel")}
        >
          {profile ? (
            <Avatar className="size-7 rounded-none">
              <AvatarImage
                src={profile.avatar_url ?? undefined}
                alt={profile.nickname}
              />
              <AvatarFallback className="rounded-none text-xs font-semibold">
                {profile.nickname[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ) : (
            <Icons.User className="size-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 p-0">
        {profile ? (
          <div className="px-3 py-2.5">
            <p className="text-sm font-medium">{profile.nickname}</p>
            <p className="label-caps">{t("auth.anonymousUser")}</p>
          </div>
        ) : (
          <div className="p-2">
            <DropdownMenuItem
              disabled={isLoading}
              onSelect={openSignInDialog}
              className="justify-center bg-foreground text-background focus:bg-foreground/90 focus:text-background"
            >
              {t("auth.signIn")}
            </DropdownMenuItem>
          </div>
        )}
        <DropdownMenuSeparator className="my-0" />

        <PreferenceRow label={t("preferences.theme")}>
          {THEMES.map((option) => (
            <Segment
              key={option}
              active={mounted && theme === option}
              onSelect={() => setTheme(option)}
            >
              {t(`theme.${option}`)}
            </Segment>
          ))}
        </PreferenceRow>
        <PreferenceRow label={t("preferences.language")}>
          {SUPPORTED_LOCALES.map((option) => (
            <Segment
              key={option}
              active={locale === option}
              onSelect={() => changeLocale(option)}
            >
              {option}
            </Segment>
          ))}
        </PreferenceRow>

        <DropdownMenuSeparator className="my-0" />
        <div className="p-1">
          <DropdownMenuItem onSelect={() => setDownloadOpen(true)}>
            <Icons.Download className="size-4" />
            {t("sidebar.downloadDesktopApp")}
          </DropdownMenuItem>
        </div>

        {profile && (
          <>
            <DropdownMenuSeparator className="my-0" />
            <div className="p-1">
              <DropdownMenuItem
                onSelect={handleSignOut}
                className="text-destructive focus:text-destructive"
              >
                <Icons.LogOut className="size-4" />
                {t("auth.signOut")}
              </DropdownMenuItem>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PreferenceRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2">
      <span className="label-caps">{label}</span>
      <div className="flex border">{children}</div>
    </div>
  );
}

/** One option of a segmented control; a menu item so arrow keys reach it, but selecting keeps the menu open. */
function Segment({
  active,
  onSelect,
  children,
}: {
  active: boolean;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  return (
    <DropdownMenuItem
      aria-checked={active}
      role="menuitemradio"
      onSelect={(event) => {
        event.preventDefault();
        onSelect();
      }}
      className={cn(
        "border-r px-2 py-1 font-mono text-[10px] uppercase tracking-[0.06em] last:border-r-0",
        active
          ? "bg-foreground text-background focus:bg-foreground focus:text-background"
          : "text-muted-foreground",
      )}
    >
      {children}
    </DropdownMenuItem>
  );
}
