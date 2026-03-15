"use client";

import { usePathname } from "next/navigation";

export type Locale = "en" | "pl";

export function useLocalePathname() {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] as Locale;
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(\/|$)/, "$1") || "/";

  function checkIfActivePath(path: string): boolean {
    if (path === "/") return pathWithoutLocale === "/";
    return pathWithoutLocale.startsWith(path);
  }

  return { pathname, locale, pathWithoutLocale, checkIfActivePath };
}
