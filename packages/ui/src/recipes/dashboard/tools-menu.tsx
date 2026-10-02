"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/dropdown-menu";
import { Icons } from "../../components/icons";
import { cn } from "../../utils/cn";
import { ActiveMarker } from "./active-marker";
import type { NavItem } from "./nav-item";

/** The pre-game tools, grouped under one top-bar item that reads as current when one of them is. */
export function ToolsMenu({ items }: { items: NavItem[] }) {
  const t = useTranslations("nav");
  const active = items.some((item) => item.active);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "relative flex items-center gap-1 text-xs font-medium uppercase tracking-[0.08em] outline-none transition-colors hover:text-foreground",
          active ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {t("tools")}
        <Icons.ChevronDown className="size-3" />
        {active && <ActiveMarker />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        {items.map(({ href, label, icon: Icon }) => (
          <DropdownMenuItem key={href} asChild>
            <Link href={href}>
              <Icon className="size-4" />
              {label}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
