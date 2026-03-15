"use client";

import { Button } from "@v1/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useScopedI18n } from "@/locales/client";
import { PATHS } from "./nav";

export function MobileNav() {
  const t = useScopedI18n("dashboard");
  const pathname = usePathname();

  const checkIfActivePath = (path: string): boolean => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  return (
    <div className="sticky bottom-0 bg-background border-t border-border py-2 md:hidden">
      <div className="flex gap-4 h-full justify-evenly">
        {PATHS.map(({ path, label, Icon }) => (
          <Button
            key={path}
            asChild
            variant={checkIfActivePath(path) ? "default" : "ghost"}
            size="icon-lg"
          >
            <Link href={path}>
              <Icon className="size-4" />
              <span className="sr-only">{t(label)}</span>
            </Link>
          </Button>
        ))}
      </div>
    </div>
  );
}
