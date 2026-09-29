"use client";

import {
  MobileNav as MobileNavView,
  type NavItem,
} from "@v1/ui/recipes/dashboard/mobile-nav";
import { usePathname } from "next/navigation";
import { useScopedI18n } from "@/locales/client";
import { withSeason } from "@/utils/season";
import { FORUM_PATH, isActivePath, PRIMARY_PATHS, TOOL_PATHS } from "./nav";
import { useNavSeason } from "./use-season-param";

/** The phone's bottom bar, with the active tab from the pathname and the season on its links. */
export function MobileNav() {
  const t = useScopedI18n("dashboard");
  const pathname = usePathname();
  const season = useNavSeason();

  const item = ({
    path,
    label,
    Icon,
    seasonScoped,
  }:
    | (typeof PRIMARY_PATHS)[number]
    | typeof FORUM_PATH
    | (typeof TOOL_PATHS)[number]): NavItem => ({
    href: seasonScoped ? withSeason(path, season) : path,
    label: t(label),
    icon: Icon,
    active: isActivePath(pathname, path),
  });

  return (
    <MobileNavView
      tabs={[...PRIMARY_PATHS, FORUM_PATH].map(item)}
      more={TOOL_PATHS.map(item)}
    />
  );
}
