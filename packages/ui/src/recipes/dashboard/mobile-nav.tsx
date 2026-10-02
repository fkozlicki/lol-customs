"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Icons } from "../../components/icons";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "../../components/sheet";
import { cn } from "../../utils/cn";
import type { NavItem } from "./nav-item";
import { TabLink } from "./tab-link";

interface MobileNavProps {
  /** The tabs on the bar, four of them; a fifth, "More", opens the rest. */
  tabs: NavItem[];
  /** What "More" opens, as a sheet from the bottom. */
  more: NavItem[];
}

/** The bottom bar on a phone. */
export function MobileNav({ tabs, more }: MobileNavProps) {
  const t = useTranslations("nav");
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = more.some((item) => item.active);

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
        <div className="grid h-14 grid-cols-5">
          {tabs.map(({ href, label, icon: Icon, active }) => (
            <TabLink key={href} href={href} active={active} label={label}>
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
              {t("more")}
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
            <SheetTitle className="label-caps">{t("more")}</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col border-t">
            {more.map(({ href, label, icon: Icon, active }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMoreOpen(false)}
                className={cn(
                  "flex items-center gap-3 border-b px-4 py-3.5 text-sm",
                  active && "font-semibold",
                )}
              >
                <Icon className="size-4 text-muted-foreground" />
                {label}
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
