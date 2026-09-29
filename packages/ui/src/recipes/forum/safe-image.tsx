"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "../../components/button";
import { Icons } from "../icons";

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
  const t = useTranslations("forum.sensitiveContent");
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
