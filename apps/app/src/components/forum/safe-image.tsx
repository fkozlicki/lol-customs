"use client";

import { Button } from "@v1/ui/button";
import { Icons } from "@v1/ui/icons";
import { useState } from "react";
import { useScopedI18n } from "@/locales/client";

interface SafeImageProps {
  src: string;
  alt?: string;
  className?: string;
  initialNsfw?: boolean;
}

export function SafeImage({
  src,
  alt,
  className,
  initialNsfw,
}: SafeImageProps) {
  const t = useScopedI18n("dashboard.pages.posts.sensitiveContent");
  const [revealed, setRevealed] = useState(false);

  if (initialNsfw && !revealed) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-md bg-muted border border-border p-8 text-center">
        <Icons.EyeOff className="size-8 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">{t("title")}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("description")}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setRevealed(true)}>
          {t("show")}
        </Button>
      </div>
    );
  }

  return <img src={src} alt={alt ?? ""} className={className} />;
}
