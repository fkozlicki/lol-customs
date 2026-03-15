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
import { SUPPORTED_LOCALES } from "@/locales";
import {
  useChangeLocale,
  useCurrentLocale,
  useScopedI18n,
} from "@/locales/client";

export function LocaleSwitcher({ className }: { className?: string }) {
  const t = useScopedI18n("locale");
  const currentLocale = useCurrentLocale();
  const changeLocale = useChangeLocale();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className={cn("gap-1.5 font-medium", className)}
          aria-label="Switch language"
        >
          <div className="relative">
            <Icons.Locale className="size-4" />
            <div className="absolute -bottom-1 -right-1 rounded-full bg-background text-foreground uppercase font-bold text-[8px] px-px">
              {currentLocale}
            </div>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {SUPPORTED_LOCALES.map((locale) => (
          <DropdownMenuItem key={locale} onClick={() => changeLocale(locale)}>
            {t(locale)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
