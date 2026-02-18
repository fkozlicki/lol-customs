"use client";

import { Button } from "@v1/ui/button";
import { cn } from "@v1/ui/cn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@v1/ui/dropdown-menu";
import { Icons } from "@v1/ui/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useScopedI18n } from "@/locales/client";

const LOCALES = ["en", "pl"] as const;

export function LocaleSwitcher({ className }: { className?: string }) {
  const pathname = usePathname();
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(\/|$)/, "$1") || "/";
  const segment = pathname.split("/")[1];
  const currentLocale: (typeof LOCALES)[number] = LOCALES.includes(
    segment as (typeof LOCALES)[number],
  )
    ? (segment as (typeof LOCALES)[number])
    : "en";
  const t = useScopedI18n("locale");
  const currentLabel = t(currentLocale);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("gap-1.5 font-medium", className)}
          aria-label="Switch language"
        >
          {currentLabel}
          <Icons.ChevronDown className="size-4 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LOCALES.map((locale) => (
          <DropdownMenuItem key={locale} asChild>
            <Link
              href={`/${locale}${pathWithoutLocale}`}
              className={cn(currentLocale === locale && "bg-accent")}
            >
              {t(locale)}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
