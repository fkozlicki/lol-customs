"use client";

import { Button } from "@v1/ui/button";
import { Icons } from "@v1/ui/icons";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useScopedI18n } from "@/locales/client";

function ThemeIcon({ theme }: { theme: string }) {
  if (theme === "light") return <Icons.Sun className="size-4" />;
  if (theme === "dark") return <Icons.Moon className="size-4" />;
  return <Icons.Monitor className="size-4" />;
}

export function ThemeSwitcher() {
  const t = useScopedI18n("dashboard.theme");
  const [mounted, setMounted] = useState(false);
  const { setTheme, resolvedTheme, theme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !theme) {
    return null;
  }

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={toggleTheme}
      aria-label={t("toggleLabel")}
    >
      <ThemeIcon theme={resolvedTheme ?? "system"} />
    </Button>
  );
}
