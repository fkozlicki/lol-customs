"use client";

import { Button } from "@v1/ui/button";
import { Icons } from "@v1/ui/icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "@v1/ui/tooltip";
import { useScopedI18n } from "@/locales/client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const THEME_ORDER = ["system", "light", "dark"] as const;

function ThemeIcon({ theme }: { theme: string }) {
  if (theme === "light") return <Icons.Sun className="size-4" />;
  if (theme === "dark") return <Icons.Moon className="size-4" />;
  return <Icons.Monitor className="size-4" />;
}

function nextTheme(
  current: (typeof THEME_ORDER)[number] | string | undefined,
): (typeof THEME_ORDER)[number] {
  const cur = (
    current && THEME_ORDER.includes(current as (typeof THEME_ORDER)[number])
      ? current
      : "system"
  ) as (typeof THEME_ORDER)[number];
  const i = THEME_ORDER.indexOf(cur);
  const nextIndex = i === -1 ? 0 : (i + 1) % THEME_ORDER.length;
  return (THEME_ORDER[nextIndex] ?? "system") as (typeof THEME_ORDER)[number];
}

export function ThemeSwitcher() {
  const t = useScopedI18n("dashboard.theme");
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const cycleTheme = () => {
    setTheme(nextTheme(theme));
  };

  const themeKey = (theme ?? "system") as (typeof THEME_ORDER)[number];
  const themeLabel =
    themeKey === "system"
      ? t("system")
      : themeKey === "light"
        ? t("light")
        : t("dark");

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={t("toggleLabel")}
        className="size-8"
      >
        <Icons.Monitor className="size-4" />
      </Button>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={cycleTheme}
          aria-label={t("toggleLabel")}
        >
          <ThemeIcon theme={resolvedTheme ?? "system"} />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{t("tooltip", { label: themeLabel })}</TooltipContent>
    </Tooltip>
  );
}
