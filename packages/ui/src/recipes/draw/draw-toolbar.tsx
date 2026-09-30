"use client";

import { useTranslations } from "next-intl";
import { Button } from "../../components/button";
import { Icons } from "../icons";

interface DrawToolbarProps {
  count: number;
  /** How many players a draw needs. */
  size: number;
  /** Teams are on screen, so the button draws again. */
  drawn: boolean;
  onClear: () => void;
  onDraw: () => void;
}

/** How full the roster is, a way to empty it, and the button that draws the teams once it is full. */
export function DrawToolbar({
  count,
  size,
  drawn,
  onClear,
  onDraw,
}: DrawToolbarProps) {
  const t = useTranslations("draw");

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-baseline gap-4">
        <span className="num text-xl font-semibold">
          {count}/{size}
        </span>
        {count > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="label-caps underline-offset-4 hover:text-foreground hover:underline"
          >
            {t("clearRoster")}
          </button>
        )}
      </div>
      <Button type="button" disabled={count < size} onClick={onDraw}>
        <Icons.Shuffle className="size-4" />
        {drawn ? t("reroll") : t("generate")}
      </Button>
    </div>
  );
}
