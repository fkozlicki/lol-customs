"use client";

import { cn } from "@v1/ui/cn";
import { Icons } from "@v1/ui/icons";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@v1/ui/sheet";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useScopedI18n } from "@/locales/client";
import { withSeason } from "@/utils/season";
import { FORUM_PATH, isActivePath, PRIMARY_PATHS, TOOL_PATHS } from "./nav";
import { useSeasonParam } from "./use-season-param";

export function MobileNav() {
  const t = useScopedI18n("dashboard");
  const pathname = usePathname();
  const season = useSeasonParam();
  const [moreOpen, setMoreOpen] = useState(false);
  const tabPaths = [...PRIMARY_PATHS, FORUM_PATH];
  const secondaryPaths = TOOL_PATHS;
  const moreActive = secondaryPaths.some(({ path }) =>
    isActivePath(pathname, path),
  );

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
        <div className="grid h-14 grid-cols-5">
          {tabPaths.map(({ path, label, Icon, seasonScoped }) => (
            <TabLink
              key={path}
              href={seasonScoped ? withSeason(path, season) : path}
              active={isActivePath(pathname, path)}
              label={t(label)}
            >
              <Icon className="size-4" />
            </TabLink>
          ))}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex flex-col items-center justify-center gap-1",
              moreActive ? "text-foreground" : "text-muted-foreground",
            )}
          >
            <Icons.More className="size-4" />
            <span className="font-mono text-[9px] uppercase tracking-[0.08em]">
              {t("sidebar.more")}
            </span>
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          side="bottom"
          className="pb-[env(safe-area-inset-bottom)]"
        >
          <SheetHeader>
            <SheetTitle className="label-caps">{t("sidebar.more")}</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col border-t">
            {secondaryPaths.map(({ path, label, Icon }) => (
              <Link
                key={path}
                href={path}
                onClick={() => setMoreOpen(false)}
                className={cn(
                  "flex items-center gap-3 border-b px-4 py-3.5 text-sm",
                  isActivePath(pathname, path) && "font-semibold",
                )}
              >
                <Icon className="size-4 text-muted-foreground" />
                {t(label)}
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function TabLink({
  href,
  active,
  label,
  children,
}: {
  href: string;
  active: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "relative flex flex-col items-center justify-center gap-1",
        active ? "text-foreground" : "text-muted-foreground",
      )}
    >
      {active && (
        <span className="absolute inset-x-3 top-0 h-0.5 bg-foreground" />
      )}
      {children}
      <span className="max-w-full truncate px-1 font-mono text-[9px] uppercase tracking-[0.08em]">
        {label}
      </span>
    </Link>
  );
}
