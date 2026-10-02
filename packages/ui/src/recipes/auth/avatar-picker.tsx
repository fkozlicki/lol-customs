"use client";

import { useTranslations } from "next-intl";
import { useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/avatar";
import { Icons } from "../../components/icons";

interface AvatarPickerProps {
  /** The picked image, as an object URL; null before one is picked. */
  preview: string | null;
  /** Shown until an image is picked: the nickname's first letter, or a camera. */
  initial: string | null;
  onPick: (file: File) => void;
}

/** A square to click and pick an avatar from the device. */
export function AvatarPicker({ preview, initial, onPick }: AvatarPickerProps) {
  const t = useTranslations("profileSetup");
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="group relative size-16 shrink-0 cursor-pointer border border-dashed border-border transition-colors duration-150 ease-(--ease-derby) hover:border-foreground"
        aria-label={t("uploadHint")}
      >
        <Avatar className="size-full rounded-none">
          <AvatarImage src={preview ?? undefined} className="rounded-none" />
          <AvatarFallback className="rounded-none bg-transparent text-xl font-semibold text-muted-foreground transition-colors duration-150 ease-(--ease-derby) group-hover:text-foreground">
            {initial ?? <Icons.Camera className="size-5" />}
          </AvatarFallback>
        </Avatar>
        <span className="absolute inset-0 flex items-center justify-center bg-foreground/60 text-background opacity-0 transition-opacity duration-150 ease-(--ease-derby) group-hover:opacity-100">
          <Icons.Camera className="size-5" />
        </span>
      </button>
      <div className="min-w-0 space-y-1">
        <p className="label-caps">{t("avatarLabel")}</p>
        <p className="text-sm text-muted-foreground">{t("uploadHint")}</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onPick(file);
        }}
      />
    </div>
  );
}
