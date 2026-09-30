"use client";

import { itemImageUrl } from "@v1/game-assets/urls";
import Image from "next/image";
import { cn } from "../../utils/cn";
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
      src={itemImageUrl(patch, itemId)}
      alt=""
      width={width}
      height={height}
      className={className}
    />
  );
}
