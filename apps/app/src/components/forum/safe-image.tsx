"use client";

import { Button } from "@v1/ui/button";
import { Icons } from "@v1/ui/icons";
import { Skeleton } from "@v1/ui/skeleton";
import type { NSFWJS } from "nsfwjs";
import { useEffect, useState } from "react";
import { useScopedI18n } from "@/locales/client";

// Any single NSFW category above this threshold flags the image
const NSFW_PER_CATEGORY_THRESHOLD = 0.35;
// Combined sum of all NSFW categories above this threshold also flags the image
const NSFW_COMBINED_THRESHOLD = 0.6;
const NSFW_CATEGORIES = new Set(["Porn", "Hentai", "Sexy"]);

// Module-level singleton — model loads once and is reused across all SafeImage instances
let modelPromise: Promise<NSFWJS> | null = null;

function getModel(): Promise<NSFWJS> {
  if (!modelPromise) {
    modelPromise = import("nsfwjs").then(({ load }) =>
      load("MobileNetV2Mid", { type: "graph" }),
    );
  }
  return modelPromise;
}

interface SafeImageProps {
  src: string;
  alt?: string;
  className?: string;
  initialNsfw?: boolean;
}

export function SafeImage({ src, alt, className, initialNsfw }: SafeImageProps) {
  const t = useScopedI18n("dashboard.pages.posts.sensitiveContent");
  const [status, setStatus] = useState<"loading" | "safe" | "nsfw">(
    initialNsfw ? "nsfw" : "loading",
  );
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    // Server-side HF check already determined this image is NSFW — skip nsfwjs
    if (initialNsfw) return;

    let cancelled = false;
    setStatus("loading");
    setRevealed(false);

    const img = new window.Image();
    img.crossOrigin = "anonymous";

    img.onload = async () => {
      if (cancelled) return;
      try {
        const model = await getModel();
        if (cancelled) return;
        const predictions = await model.classify(img);
        if (cancelled) return;
        const nsfwPredictions = predictions.filter((p) =>
          NSFW_CATEGORIES.has(p.className),
        );
        const combinedScore = nsfwPredictions.reduce(
          (sum, p) => sum + p.probability,
          0,
        );
        const isNsfw =
          nsfwPredictions.some(
            (p) => p.probability >= NSFW_PER_CATEGORY_THRESHOLD,
          ) || combinedScore >= NSFW_COMBINED_THRESHOLD;
        setStatus(isNsfw ? "nsfw" : "safe");
      } catch {
        // Fail closed — on classification error, blur the image
        if (!cancelled) setStatus("nsfw");
      }
    };

    img.onerror = () => {
      if (!cancelled) setStatus("safe");
    };

    img.src = src;

    return () => {
      cancelled = true;
    };
  }, [src, initialNsfw]);

  if (status === "loading") {
    return <Skeleton className="w-full h-48 rounded-md" />;
  }

  if (status === "nsfw" && !revealed) {
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
