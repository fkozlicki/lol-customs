"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { championImageUrl } from "@/utils/asset-urls";
import { cn } from "@v1/ui/cn";
import Image from "next/image";
import { useTRPC } from "@/trpc/react";

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
  const trpc = useTRPC();
  const { data: patch } = useSuspenseQuery(
    trpc.datadragon.currentPatch.queryOptions(),
  );
  const { data: championMap } = useSuspenseQuery(
    trpc.datadragon.championMap.queryOptions(),
  );

  const champion = championId != null ? championMap[String(championId)] : null;

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
      src={championImageUrl(patch, champion.imageFull)}
      alt={champion.name}
      width={width}
      height={height}
      className={className}
    />
  );
}
