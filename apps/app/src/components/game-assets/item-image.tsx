"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { cn } from "@v1/ui/cn";
import Image from "next/image";
import { useTRPC } from "@/trpc/react";
import { itemImageUrl } from "@/utils/asset-urls";

interface ItemImageProps {
  itemId: number | null;
  width: number;
  height: number;
  isVictorious: boolean;
  className?: string;
}

export function ItemImage({
  itemId,
  width,
  height,
  isVictorious,
  className,
}: ItemImageProps) {
  const trpc = useTRPC();
  const { data: patch } = useSuspenseQuery(
    trpc.datadragon.currentPatch.queryOptions(),
  );

  if (!itemId) {
    return (
      <div
        className={cn("rounded-sm bg-muted", {
          "bg-blue-500/10 dark:bg-blue-900/50": isVictorious,
          "bg-red-500/10 dark:bg-red-900/50": !isVictorious,
        })}
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
