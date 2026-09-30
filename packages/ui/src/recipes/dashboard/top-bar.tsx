"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { NavItem } from "./nav-item";
import { ToolsMenu } from "./tools-menu";
import { TopBarLink } from "./top-bar-link";

interface TopBarProps {
  /** Where the wordmark goes: the standings, with the season carried. */
  homeHref: string;
  /** The mark beside the wordmark; the app serves it. */
  logoSrc: string;
  /** The places people come to Derby for. */
  primary: NavItem[];
  /** The pre-game tools, under one menu. */
  tools: NavItem[];
  forum: NavItem;
  /** On the right: the season picker and the account menu. */
  actions?: React.ReactNode;
}

/** The dashboard's bar on wide screens; phones get the bottom bar instead. */
export function TopBar({
  homeHref,
  logoSrc,
  primary,
  tools,
  forum,
  actions,
}: TopBarProps) {
  const t = useTranslations("nav");

  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-4">
        <Link href={homeHref} className="flex shrink-0 items-center gap-2">
          <Image src={logoSrc} alt="" width={24} height={24} />
          <span className="text-sm font-semibold uppercase tracking-[0.12em]">
            {t("appName")}
          </span>
        </Link>

        <nav className="hidden h-full items-stretch gap-5 md:flex">
          {primary.map((item) => (
            <TopBarLink key={item.href} href={item.href} active={item.active}>
              {item.label}
            </TopBarLink>
          ))}
          <ToolsMenu items={tools} />
          <TopBarLink href={forum.href} active={forum.active}>
            {forum.label}
          </TopBarLink>
        </nav>

        <div className="ml-auto flex items-center gap-2">{actions}</div>
      </div>
    </header>
  );
}
