"use client";

import { useReducedMotion } from "motion/react";
import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";
import { championLoadingArtUrl } from "@/utils/asset-urls";
import {
  analyse,
  type Dot,
  type Frame,
  halfColumn,
  type InkMap,
  JITTER,
  place,
  type Slot,
  screen,
  UNDER_COLUMN,
} from "./halftone";
import type { Portrait } from "./use-standings-portraits";

/** Alternates sides so consecutive portraits never land in the same gutter. */
const SLOTS: Slot[] = [
  { side: 1, y: 0.34, shift: 0 },
  { side: -1, y: 0.3, shift: 0.3 },
  { side: 1, y: 0.28, shift: -0.25 },
  { side: -1, y: 0.36, shift: 0 },
];

/** How long a portrait stays, and how long it takes to gather and to scatter, in ms. */
const HOLD = 9000;
const IN = 1900;
const OUT = 1300;
/** The next portrait starts gathering this far into the previous one scattering. */
const HANDOVER = 450;
/** Radius of the pointer's spotlight, in CSS pixels. */
const SPOT = 200;
/** Opacity of the ink, per theme. */
const ALPHA = { dark: 0.2, light: 0.17 };

interface Layer {
  dots: Dot[];
  index: number;
  phase: "in" | "hold" | "out";
  start: number;
}

const easeOut = (t: number) => 1 - (1 - t) ** 3;

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

function inkMapFor(championId: string) {
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

/**
 * The page's theme as the canvas needs it. Read from the document, not from React state: the ink
 * is a token, and only the document knows its current value.
 */
function readTheme() {
  const root = document.documentElement;
  return {
    dark: root.classList.contains("dark"),
    ink: getComputedStyle(root).getPropertyValue("--foreground").trim(),
  };
}

/**
 * Halftone portraits of `portraits`, one at a time, on a canvas the size of the window. A portrait
 * gathers from scattered dots, stays, and scatters while the next gathers in the other gutter; dots
 * swell a little under the pointer. With reduced motion the first portrait stands still.
 *
 * The rotation loops, which DESIGN.md allows only as an accepted exception; see there.
 */
export function HalftonePortraits({
  portraits,
  onShow,
  onLeave,
}: {
  portraits: Portrait[];
  /** A portrait starts gathering, on `slot.side` of the content column. */
  onShow?: (index: number, slot: Slot) => void;
  /** The portrait on screen starts scattering. */
  onLeave?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();
  const reduced = useReducedMotion() ?? false;
  const callbacks = useRef({ onShow, onLeave });
  callbacks.current = { onShow, onLeave };
  // Survives a restart (new standings), so the rotation carries on where it was.
  const indexRef = useRef(0);
  // Repaints the portraits on screen in the page's current theme; set by the drawing effect.
  const rethemeRef = useRef<() => void>(() => {});
  const ids = portraits.map((p) => p.championId).join(",");

  // A theme change repaints what is on screen, as the rest of the page does, without restarting the
  // rotation. next-themes sets the theme's class in its own effect, which runs after this one, so the
  // colours are read a frame later, once the document has them.
  useEffect(() => {
    if (!resolvedTheme) return;
    const frame = requestAnimationFrame(() => rethemeRef.current());
    return () => cancelAnimationFrame(frame);
  }, [resolvedTheme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !ids) return;
    const list = ids.split(",");

    let theme = readTheme();
    let layers: Layer[] = [];
    let frame: Frame = { width: 0, height: 0 };
    let raf = 0;
    let timer = 0;
    let cancelled = false;
    // The spotlight eases towards the pointer and fades in and out, rather than snapping.
    const spot = { x: 0, y: 0, tx: 0, ty: 0, strength: 0, target: 0 };

    const slotFor = (index: number) => SLOTS[index % SLOTS.length] ?? SLOTS[0];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      frame = { width: window.innerWidth, height: window.innerHeight };
      canvas.width = frame.width * dpr;
      canvas.height = frame.height * dpr;
      canvas.style.width = `${frame.width}px`;
      canvas.style.height = `${frame.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const dotsFor = async (index: number) => {
      const id = list[index];
      const slot = slotFor(index);
      if (!id || !slot) return null;
      const map = await inkMapFor(id);
      if (!map) return null;
      return screen(map, place(map, frame, slot), frame, theme.dark);
    };

    const draw = (now: number) => {
      raf = 0;
      spot.x += (spot.tx - spot.x) * 0.18;
      spot.y += (spot.ty - spot.y) * 0.18;
      spot.strength += (spot.target - spot.strength) * 0.12;
      let animating =
        Math.abs(spot.target - spot.strength) > 0.01 ||
        Math.hypot(spot.tx - spot.x, spot.ty - spot.y) > 0.5;

      ctx.clearRect(0, 0, frame.width, frame.height);
      ctx.fillStyle = theme.ink;
      ctx.globalAlpha = theme.dark ? ALPHA.dark : ALPHA.light;

      layers = layers.filter((layer) => {
        const elapsed = now - layer.start;
        if (layer.phase === "out" && elapsed > OUT) return false;
        if (layer.phase === "in" && elapsed > IN) layer.phase = "hold";
        if (layer.phase !== "hold") animating = true;

        ctx.beginPath();
        for (const dot of layer.dots) {
          let scale = 1;
          let drift = 0;
          if (layer.phase === "in") {
            const t = easeOut(
              Math.min(1, Math.max(0, (elapsed - dot.delay) / (IN - JITTER))),
            );
            scale = t;
            drift = 1 - t;
          } else if (layer.phase === "out") {
            // The outer dots, which gathered last, scatter first.
            const t = Math.min(
              1,
              Math.max(
                0,
                (elapsed - (JITTER - dot.delay) * 0.6) / (OUT - JITTER * 0.6),
              ),
            );
            scale = 1 - t * t;
            drift = t * t * 1.6;
          }
          if (scale <= 0.02) continue;

          let r = dot.r * scale;
          if (spot.strength > 0.01) {
            const d = Math.hypot(dot.x - spot.x, dot.y - spot.y);
            if (d < SPOT) r *= 1 + 0.35 * spot.strength * (1 - d / SPOT) ** 2;
          }
          const x = dot.x + dot.dx * drift;
          const y = dot.y + dot.dy * drift;
          ctx.moveTo(x + r, y);
          ctx.arc(x, y, r, 0, Math.PI * 2);
        }
        ctx.fill();
        return true;
      });
      ctx.globalAlpha = 1;

      if (animating) raf = requestAnimationFrame(draw);
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(draw);
    };

    const show = async (index: number, attempts = 0): Promise<void> => {
      if (attempts >= list.length) return;
      const dots = await dotsFor(index);
      if (cancelled) return;
      if (!dots) {
        await show((index + 1) % list.length, attempts + 1);
        return;
      }
      indexRef.current = index;
      const slot = slotFor(index);
      if (slot) callbacks.current.onShow?.(index, slot);
      layers.push({
        dots,
        index,
        phase: reduced ? "hold" : "in",
        start: performance.now(),
      });
      schedule();
      const next = list[(index + 1) % list.length];
      if (next) inkMapFor(next);
      if (!reduced && list.length > 1) {
        timer = window.setTimeout(leave, IN + HOLD);
      }
    };

    const leave = () => {
      for (const layer of layers) {
        layer.phase = "out";
        layer.start = performance.now();
      }
      callbacks.current.onLeave?.();
      schedule();
      timer = window.setTimeout(
        () => show((indexRef.current + 1) % list.length),
        HANDOVER,
      );
    };

    /** Screens the portraits on screen again, for a new window size or a new theme. */
    const redraw = async () => {
      for (const layer of layers) {
        const dots = await dotsFor(layer.index);
        if (dots && !cancelled) layer.dots = dots;
      }
      schedule();
    };

    rethemeRef.current = () => {
      const next = readTheme();
      if (next.dark === theme.dark && next.ink === theme.ink) return;
      theme = next;
      // Paint the new ink straight away; the dots follow once screened for the new theme.
      schedule();
      redraw();
    };

    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        resize();
        redraw();
      }, 150);
    };
    const onMove = (event: PointerEvent) => {
      if (reduced) return;
      // Over the content column there are no dots to swell: let the spotlight fade and the canvas rest.
      const away = Math.abs(event.clientX - frame.width / 2);
      const near = away > halfColumn(frame.width) - UNDER_COLUMN - SPOT;
      spot.tx = event.clientX;
      spot.ty = event.clientY;
      if (near && spot.strength < 0.01) {
        spot.x = spot.tx;
        spot.y = spot.ty;
      }
      spot.target = near ? 1 : 0;
      if (near || spot.strength > 0.01) schedule();
    };
    const onLeaveWindow = () => {
      spot.target = 0;
      schedule();
    };

    resize();
    show(indexRef.current % list.length);
    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onMove);
    document.documentElement.addEventListener("pointerleave", onLeaveWindow);
    return () => {
      cancelled = true;
      rethemeRef.current = () => {};
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener(
        "pointerleave",
        onLeaveWindow,
      );
    };
  }, [ids, reduced]);

  return <canvas ref={canvasRef} className="absolute inset-0" />;
}
