"use client";

import { spellImageUrl } from "@v1/game-assets/urls";
import Image from "next/image";
import { useGamePatch } from "./game-patch";

interface SpellImageProps {
  spellId: number;
  width: number;
  height: number;
  className?: string;
}

export function SpellImage({
  spellId,
  width,
  height,
  className,
}: SpellImageProps) {
  const patch = useGamePatch();

  return (
    <Image
      src={spellImageUrl(patch, spellId)}
      alt=""
      width={width}
      height={height}
      className={className}
    />
  );
}
