"use client";

import { cn } from "@v1/ui/cn";
import Image from "next/image";
import { itemImageUrl } from "@/utils/asset-urls";
import { useGamePatch } from "./game-patch";

interface ItemImageProps {
  itemId: number | null;
  width: number;
  height: number;
  className?: string;
}

export function ItemImage({
  itemId,
  width,
  height,
  className,
}: ItemImageProps) {
  const patch = useGamePatch();

  if (!itemId) {
    return (
      <div
        className={cn("bg-foreground/[0.06]", className)}
        style={{ width, height }}
      />
    );
  }

  return (
    <Image
      src={itemImageUrl(patch, `${itemId}.png`)}
      alt=""
      width={width}
      height={height}
      unoptimized
      className={className}
    />
  );
}
