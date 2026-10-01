"use client";

import { useState } from "react";
import { cn } from "../../utils/cn";
import { HalftonePortraits, type Portrait } from "./halftone-portraits";

/**
 * The portraits and their caption, for any list of portraits: the player's name stands in upright
 * letters on the edge of the window opposite the portrait, and fades with it.
 *
 * Which champions (the top five's mains), and whether the window is wide enough for any, is the
 * app's to decide.
 */
export function BackdropPortraits({ portraits }: { portraits: Portrait[] }) {
  const [caption, setCaption] = useState<{
    index: number;
    /** The side the portrait is on; the caption takes the other one. */
    portraitSide: -1 | 1;
    visible: boolean;
  } | null>(null);
  const portrait = caption ? portraits[caption.index] : undefined;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      <HalftonePortraits
        portraits={portraits}
        onShow={(index, slot) =>
          setCaption({ index, portraitSide: slot.side, visible: true })
        }
        onLeave={() =>
          setCaption((current) => current && { ...current, visible: false })
        }
      />
      {portrait && caption && (
        <p
          className={cn(
            // Fades out within the handover, so it has gone before it moves to the other edge.
            "label-caps absolute top-1/2 -translate-y-1/2 whitespace-nowrap [text-orientation:upright] [writing-mode:vertical-rl] transition-opacity duration-400 ease-derby",
            caption.portraitSide === 1 ? "left-6" : "right-6",
            caption.visible ? "opacity-100" : "opacity-0",
          )}
        >
          {portrait.position !== null && (
            <span className="num">#{portrait.position} · </span>
          )}
          {portrait.playerName && `${portrait.playerName} · `}
          {portrait.championName}
        </p>
      )}
    </div>
  );
}
