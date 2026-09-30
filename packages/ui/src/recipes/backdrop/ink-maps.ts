import { championLoadingArtUrl } from "@v1/game-assets/urls";
import { analyse, type InkMap } from "./halftone";

/** Runs `work` in the browser's idle time (or soon, where there is no such thing). */
function idle<T>(work: () => T) {
  return new Promise<T>((resolve) => {
    const run = () => resolve(work());
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(run, { timeout: 1500 });
    } else {
      setTimeout(run, 0);
    }
  });
}

function loadArt(championId: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = championLoadingArtUrl(championId);
  });
}

/**
 * Ink maps by champion, kept for the life of the page. A map holds both themes, so a theme change or
 * a remount redraws without analysing the art again.
 */
const inkMaps = new Map<string, Promise<InkMap | null>>();

export function inkMapFor(championId: string) {
  let found = inkMaps.get(championId);
  if (!found) {
    // Analysing an art takes ~100 ms of main thread: do it when the browser is idle.
    found = loadArt(championId)
      .then((img) => idle(() => analyse(img, championId)))
      .catch(() => null);
    inkMaps.set(championId, found);
  }
  return found;
}
