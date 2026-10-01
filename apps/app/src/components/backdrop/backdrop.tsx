"use client";

import { BackdropPortraits } from "@v1/ui/recipes/backdrop/backdrop-portraits";
import { useEffect, useState } from "react";
import { useStandingsPortraits } from "./use-standings-portraits";

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
