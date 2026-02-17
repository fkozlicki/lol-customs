"use client";

import { cn } from "@v1/ui/cn";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LOCALES = [
  { code: "en", label: "EN" },
  { code: "pl", label: "PL" },
] as const;

export function LocaleSwitcher({ className }: { className?: string }) {
  const pathname = usePathname();
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(\/|$)/, "$1") || "/";
  const currentLocale = pathname.split("/")[1] ?? "en";

  return (
    <div
      className={cn(
        "flex rounded-md border border-border bg-muted/30 p-0.5",
        className,
      )}
    >
      {LOCALES.map(({ code, label }) => (
        <Link
          key={code}
          href={`/${code}${pathWithoutLocale}`}
          className={cn(
            "rounded px-2 py-1 text-xs font-medium transition-colors",
            currentLocale === code
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
          aria-current={currentLocale === code ? "true" : undefined}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
