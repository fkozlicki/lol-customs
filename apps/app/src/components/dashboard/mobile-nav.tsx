"use client";

import { Button } from "@v1/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useScopedI18n } from "@/locales/client";
import { withSeason } from "@/utils/season";
import { PATHS } from "./nav";
import { useSeasonParam } from "./use-season-param";

export function MobileNav() {
  const t = useScopedI18n("dashboard");
  const pathname = usePathname();
  const season = useSeasonParam();

  const checkIfActivePath = (path: string): boolean => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  return (
    <div className="sticky bottom-0 bg-background border-t border-border py-2 md:hidden">
      <div className="grid h-full grid-cols-7 gap-1 px-1">
        {PATHS.map(({ path, label, Icon, seasonScoped }) => (
          <Button
            key={path}
            asChild
            variant={checkIfActivePath(path) ? "default" : "ghost"}
            size="icon-lg"
            className="w-full"
          >
            <Link href={seasonScoped ? withSeason(path, season) : path}>
              <Icon className="size-4" />
              <span className="sr-only">{t(label)}</span>
            </Link>
          </Button>
        ))}
      </div>
    </div>
  );
}
