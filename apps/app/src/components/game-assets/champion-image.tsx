"use client";

import { cn } from "@v1/ui/cn";
import Image from "next/image";
import { CHAMPIONS } from "@/game-data/champions";
import { championImageUrl } from "@/utils/asset-urls";
import { useGamePatch } from "./game-patch";

interface ChampionImageProps {
  championId: number | null;
  width: number;
  height: number;
  className?: string;
}

export function ChampionImage({
  championId,
  width,
  height,
  className,
}: ChampionImageProps) {
  const patch = useGamePatch();
  // A champion released after champions.ts was generated falls through to the placeholder.
  const champion = championId != null ? CHAMPIONS[championId] : undefined;

  if (!champion) {
    return (
      <div
        className={cn("shrink-0 rounded-sm bg-muted", className)}
        style={{ width, height }}
      />
    );
  }

  return (
    <Image
      src={championImageUrl(patch, champion.image)}
      alt={champion.name}
      width={width}
      height={height}
      className={className}
    />
  );
}
