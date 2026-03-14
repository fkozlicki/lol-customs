"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useTRPC } from "@/trpc/react";
import { itemImageUrl } from "@/utils/asset-urls";

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
  const trpc = useTRPC();
  const { data: patch } = useSuspenseQuery(
    trpc.datadragon.currentPatch.queryOptions(),
  );

  if (!itemId) {
    return <div className="rounded-sm bg-muted" style={{ width, height }} />;
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
