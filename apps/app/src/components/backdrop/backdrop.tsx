"use client";

import { cn } from "@v1/ui/cn";
import { useEffect, useState } from "react";
import { HalftonePortraits } from "./halftone-portraits";
import {
  type Portrait,
  useStandingsPortraits,
} from "./use-standings-portraits";

/** `xl`: below it the content column leaves no gutter, and a portrait would sit under the text. */
const WIDE = "(min-width: 1280px)";

function useWide() {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const query = window.matchMedia(WIDE);
    setWide(query.matches);
    const onChange = () => setWide(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  return wide;
}

/**
 * The dashboard's backdrop: halftone portraits of the champions the top five play most, taking
 * turns beside the content column. Decoration drawn from the ladder's own data, in the foreground
 * ink; DESIGN.md lists why it may loop. Rendered once, by the dashboard layout, behind everything,
 * and only on windows wide enough to have a gutter.
 */
export function Backdrop() {
  const wide = useWide();
  const portraits = useStandingsPortraits({ enabled: wide });
  if (!wide || !portraits) return null;
  return <BackdropPortraits portraits={portraits} />;
}

/**
 * The portraits and their caption, for any list of portraits: the player's name stands in upright
 * letters on the edge of the window opposite the portrait, and fades with it.
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
