"use client";

import type { NavItem } from "@v1/ui/recipes/dashboard/nav-item";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { withSeason } from "@/utils/season";
import { FORUM_PATH, isActivePath, PRIMARY_PATHS, TOOL_PATHS } from "./nav";
import { useNavSeason } from "./use-season-param";

type NavPath =
  | (typeof PRIMARY_PATHS)[number]
  | (typeof TOOL_PATHS)[number]
  | typeof FORUM_PATH;

/**
 * Derby's destinations as both navigation bars draw them: labelled in the reader's language, marked
 * current from the pathname, and carrying the season where the page is season-scoped.
 */
export function useNavItems() {
  const t = useTranslations("dashboard");
  const pathname = usePathname();
  const season = useNavSeason();

  const item = ({ path, label, Icon, seasonScoped }: NavPath): NavItem => ({
    href: seasonScoped ? withSeason(path, season) : path,
    label: t(label),
    icon: Icon,
    active: isActivePath(pathname, path),
  });

  return {
    homeHref: withSeason("/", season),
    primary: PRIMARY_PATHS.map(item),
    tools: TOOL_PATHS.map(item),
    forum: item(FORUM_PATH),
  };
}
