"use client";

import { cn } from "@v1/ui/cn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@v1/ui/dropdown-menu";
import { Icons } from "@v1/ui/icons";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useScopedI18n } from "@/locales/client";
import { DURATION } from "@/utils/motion";
import { withSeason } from "@/utils/season";
import { AccountMenu } from "./account-menu";
import { LocaleSwitcher } from "./locale-switcher";
import { FORUM_PATH, isActivePath, PRIMARY_PATHS, TOOL_PATHS } from "./nav";
import { SeasonSelector } from "./season-selector";
import { ThemeSwitcher } from "./theme-switcher";
import { useDownloadDialog } from "./use-download-dialog";
import { useSeasonParam } from "./use-season-param";

export function TopBar() {
  const t = useScopedI18n("dashboard");
  const pathname = usePathname();
  const season = useSeasonParam();
  const [, setDownloadOpen] = useDownloadDialog();
  const toolsActive = TOOL_PATHS.some(({ path }) =>
    isActivePath(pathname, path),
  );

  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-4">
        <Link
          href={withSeason("/", season)}
          className="flex shrink-0 items-center gap-2"
        >
          <Image src="/jasper.jpg" alt="" width={24} height={24} />
          <span className="text-sm font-semibold uppercase tracking-[0.12em]">
            {t("sidebar.appName")}
          </span>
        </Link>

        <nav className="hidden h-full items-stretch gap-5 md:flex">
          {PRIMARY_PATHS.map(({ path, label, seasonScoped }) => (
            <NavLink
              key={path}
              href={seasonScoped ? withSeason(path, season) : path}
              active={isActivePath(pathname, path)}
            >
              {t(label)}
            </NavLink>
          ))}

          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "relative flex items-center gap-1 text-xs font-medium uppercase tracking-[0.08em] outline-none transition-colors hover:text-foreground",
                toolsActive ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {t("sidebar.tools")}
              <Icons.ChevronDown className="size-3" />
              {toolsActive && <ActiveMarker />}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              {TOOL_PATHS.map(({ path, label, Icon }) => (
                <DropdownMenuItem key={path} asChild>
                  <Link href={path}>
                    <Icon className="size-4" />
                    {t(label)}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <NavLink
            href={FORUM_PATH.path}
            active={isActivePath(pathname, FORUM_PATH.path)}
          >
            {t(FORUM_PATH.label)}
          </NavLink>
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <SeasonSelector />
          <div className="hidden items-center gap-1 md:flex">
            <button
              type="button"
              onClick={() => setDownloadOpen(true)}
              className="inline-flex size-7 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
              aria-label={t("sidebar.downloadDesktopApp")}
              title={t("sidebar.downloadDesktopApp")}
            >
              <Icons.Download className="size-4" />
            </button>
            <ThemeSwitcher />
            <LocaleSwitcher />
          </div>
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      prefetch={true}
      className={cn(
        "relative flex items-center text-xs font-medium uppercase tracking-[0.08em] transition-colors hover:text-foreground",
        active ? "text-foreground" : "text-muted-foreground",
      )}
    >
      {children}
      {active && <ActiveMarker />}
    </Link>
  );
}

function ActiveMarker() {
  return (
    <motion.span
      layoutId="top-bar-active"
      transition={{ duration: DURATION.base }}
      className="absolute inset-x-0 -bottom-px h-0.5 bg-foreground"
    />
  );
}
