"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@v1/ui/avatar";
import { cn } from "@v1/ui/cn";
import { getImageProps } from "next/image";
import { profileIconUrl } from "@/utils/asset-urls";
import { useGamePatch } from "./game-patch";

/**
 * The largest an icon is drawn — the profile header's `size-24`. `next/image` needs a number to
 * build its srcset; smaller avatars download this size, which as webp is a few kilobytes.
 */
const ICON_SIZE = 96;

interface ProfileIconProps {
  iconId: number | null;
  name: string;
  avatarClassName?: string;
  fallbackClassName?: string;
  fallbackChars?: number;
}

export function ProfileIcon({
  iconId,
  name,
  avatarClassName,
  fallbackClassName,
  fallbackChars = 2,
}: ProfileIconProps) {
  const iconUrl = profileIconUrl(useGamePatch(), iconId);
  // Radix's Avatar renders its own <img> and switches to the fallback if it fails to load, which
  // next/image's component cannot do. getImageProps gives that <img> the optimised src and srcset.
  const image = iconUrl
    ? getImageProps({
        src: iconUrl,
        alt: "",
        width: ICON_SIZE,
        height: ICON_SIZE,
      }).props
    : null;

  return (
    <Avatar className={cn("shrink-0", avatarClassName)}>
      {image ? (
        <AvatarImage
          src={image.src}
          srcSet={image.srcSet}
          alt=""
          className="object-cover"
        />
      ) : null}
      <AvatarFallback
        className={cn("bg-muted text-muted-foreground", fallbackClassName)}
      >
        {name.slice(0, fallbackChars).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}
