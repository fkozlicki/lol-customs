"use client";

import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/avatar";
import { Button } from "../../components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/dropdown-menu";
import { Icons } from "../icons";
import { PreferenceOption } from "./preference-option";
import { PreferenceRow } from "./preference-row";

export const THEMES = ["system", "light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

interface AccountMenuProps {
  /** The signed-in person; null for a visitor. */
  profile: { nickname: string; avatarUrl: string | null } | null;
  /** While the session is still being read, signing in waits. */
  loading: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  /** The chosen theme; undefined until the page knows it, so nothing is marked wrongly. */
  theme: string | undefined;
  onThemeChange: (theme: Theme) => void;
  locale: string;
  locales: readonly string[];
  onLocaleChange: (locale: string) => void;
  onDownload: () => void;
}

/** Account, theme, language and the Derby Sync download behind one button. */
export function AccountMenu({
  profile,
  loading,
  onSignIn,
  onSignOut,
  theme,
  onThemeChange,
  locale,
  locales,
  onLocaleChange,
  onDownload,
}: AccountMenuProps) {
  const t = useTranslations("account");
  const tDownload = useTranslations("download");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon-sm" aria-label={t("menuLabel")}>
          {profile ? (
            <Avatar className="size-7 rounded-none">
              <AvatarImage
                src={profile.avatarUrl ?? undefined}
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
            <p className="label-caps">{t("anonymousUser")}</p>
          </div>
        ) : (
          <div className="p-2">
            <DropdownMenuItem
              disabled={loading}
              onSelect={onSignIn}
              className="justify-center bg-foreground text-background focus:bg-foreground/90 focus:text-background"
            >
              {t("signIn")}
            </DropdownMenuItem>
          </div>
        )}
        <DropdownMenuSeparator className="my-0" />

        <PreferenceRow label={t("theme")}>
          {THEMES.map((option) => (
            <PreferenceOption
              key={option}
              active={theme === option}
              onSelect={() => onThemeChange(option)}
            >
              {t(`themes.${option}`)}
            </PreferenceOption>
          ))}
        </PreferenceRow>
        <PreferenceRow label={t("language")}>
          {locales.map((option) => (
            <PreferenceOption
              key={option}
              active={locale === option}
              onSelect={() => onLocaleChange(option)}
            >
              {option}
            </PreferenceOption>
          ))}
        </PreferenceRow>

        <DropdownMenuSeparator className="my-0" />
        <div className="p-1">
          <DropdownMenuItem onSelect={onDownload}>
            <Icons.Download className="size-4" />
            {tDownload("button")}
          </DropdownMenuItem>
        </div>

        {profile && (
          <>
            <DropdownMenuSeparator className="my-0" />
            <div className="p-1">
              <DropdownMenuItem
                onSelect={onSignOut}
                className="text-destructive focus:text-destructive"
              >
                <Icons.LogOut className="size-4" />
                {t("signOut")}
              </DropdownMenuItem>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
