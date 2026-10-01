"use client";

import { champion as findChampion } from "@v1/game-assets/champions";
import { championImageUrl } from "@v1/game-assets/urls";
import Image from "next/image";
import { cn } from "../../utils/cn";
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
  // A champion released after the list was generated falls through to the placeholder.
  const champion = findChampion(championId);

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
      src={championImageUrl(patch, champion.imageFile)}
      alt={champion.name}
      width={width}
      height={height}
      className={className}
    />
  );
}
