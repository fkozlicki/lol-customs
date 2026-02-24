"use client";

import { Button } from "@v1/ui/button";
import { Icons } from "@v1/ui/icons";
import { Skeleton } from "@v1/ui/skeleton";
import type { NSFWJS } from "nsfwjs";
import { useEffect, useState } from "react";

// Threshold per individual category — any single NSFW class above this flags the image
const NSFW_PER_CATEGORY_THRESHOLD = 0.5;
const NSFW_CATEGORIES = new Set(["Porn", "Hentai", "Sexy"]);

// Module-level singleton — model loads once and is reused across all SafeImage instances
let modelPromise: Promise<NSFWJS> | null = null;

function getModel(): Promise<NSFWJS> {
  if (!modelPromise) {
    // Use default MobileNetV2 — more reliable in bundled environments than MobileNetV2Mid (graph model)
    modelPromise = import("nsfwjs").then(({ load }) => load("MobileNetV2"));
  }
  return modelPromise;
}

interface SafeImageProps {
  src: string;
  alt?: string;
  className?: string;
}

export function SafeImage({ src, alt, className }: SafeImageProps) {
  const [status, setStatus] = useState<"loading" | "safe" | "nsfw">("loading");
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
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
        const isNsfw = predictions.some(
          (p) =>
            NSFW_CATEGORIES.has(p.className) &&
            p.probability >= NSFW_PER_CATEGORY_THRESHOLD,
        );
        setStatus(isNsfw ? "nsfw" : "safe");
      } catch {
        // On classification error, show the image
        if (!cancelled) setStatus("safe");
      }
    };

    img.onerror = () => {
      if (!cancelled) setStatus("safe");
    };

    img.src = src;

    return () => {
      cancelled = true;
    };
  }, [src]);

  if (status === "loading") {
    return <Skeleton className="w-full h-48 rounded-md" />;
  }

  if (status === "nsfw" && !revealed) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-md bg-muted border border-border p-8 text-center">
        <Icons.EyeOff className="size-8 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">Sensitive content</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            This image may contain adult content.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setRevealed(true)}>
          Show image
        </Button>
      </div>
    );
  }

  return <img src={src} alt={alt ?? ""} className={className} />;
}
