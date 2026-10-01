"use client";

import { createClient } from "@v1/supabase/client";
import { AccountMenu as AccountMenuView } from "@v1/ui/recipes/dashboard/account-menu";
import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useUser } from "@/components/auth/user-context";
import { usePathname, useRouter } from "@/i18n/navigation";
import { SUPPORTED_LOCALES } from "@/locales";
import { useDownloadDialog } from "./use-download-dialog";

/** The account menu, wired to the session, the theme, the language and the download dialog. */
export function AccountMenu() {
  const { profile, isLoading, openSignInDialog } = useUser();
  const [, setDownloadOpen] = useDownloadDialog();
  const { theme, setTheme } = useTheme();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // The theme is only known in the browser; marking one before then would flash the wrong option.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <AccountMenuView
      profile={
        profile
          ? { nickname: profile.nickname, avatarUrl: profile.avatar_url }
          : null
      }
      loading={isLoading}
      onSignIn={openSignInDialog}
      onSignOut={() => createClient().auth.signOut()}
      theme={mounted ? theme : undefined}
      onThemeChange={setTheme}
      locale={locale}
      locales={SUPPORTED_LOCALES}
      onLocaleChange={(option) =>
        // Same page, same query (the season stays): only the language changes.
        router.replace(
          { pathname, query: Object.fromEntries(searchParams) },
          { locale: option as (typeof SUPPORTED_LOCALES)[number] },
        )
      }
      onDownload={() => setDownloadOpen(true)}
    />
  );
}
