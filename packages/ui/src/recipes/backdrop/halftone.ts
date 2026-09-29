/**
 * Turns a champion's loading-screen art into halftone dots for the backdrop. Free of React, so the
 * geometry can be tested on its own.
 *
 * `analyse` reads the art once and keeps two ink maps, one per theme: the dark page draws the light
 * in the art, paper draws its shadows, as a newspaper would. Around the face the local contrast is
 * lifted, the way a retoucher dodges and burns a portrait for print, and ink fades with distance from
 * it. `place` fits the whole figure to the window's height with the face in the middle of the gutter.
 * `screen` lays the dots on a 45° screen anchored at the face.
 */

import { FACES } from "./faces";

export interface InkMap {
  width: number;
  height: number;
  /** Ink per pixel of the art on the dark page. */
  dark: Float32Array;
  /** Ink per pixel of the art on paper. */
  light: Float32Array;
  /** The face, as fractions of the art. */
  focus: { x: number; y: number };
}

export interface Frame {
  width: number;
  height: number;
}

/** A place beside the content column. */
export interface Slot {
  side: -1 | 1;
  /** Height of the face, as a fraction of the window's height. */
  y: number;
  /** Moves the face across the gutter: 0 is its middle, positive is towards the window's edge. */
  shift: number;
}

/** Where the art lands, in CSS pixels. */
export interface Placement {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface Dot {
  x: number;
  y: number;
  r: number;
  /** ms into a transition before this dot moves. */
  delay: number;
  /** Where the dot drifts from when it gathers, relative to its place. */
  dx: number;
  dy: number;
}

/** Distance between dots, in CSS pixels. */
export const CELL = 6;
/** Share of its cell the largest dot covers; below ~0.8 the dots never touch. */
const COVERAGE = 0.66;
/** Longest per-dot delay inside a transition, so a portrait gathers and scatters unevenly. */
export const JITTER = 700;
/** How far under the content column the portrait reaches while it fades out. */
export const UNDER_COLUMN = 170;
/** Height of the art as a multiple of the window's height. */
const FILL = 1.1;
/** A face is about a fifth of the loading art's width. */
const FACE_SHARE = 0.2;

/** Mean ink the portrait carries around the face, per theme; the tone curve is levelled to it. */
const DENSITY = { dark: 0.21, light: 0.6 };
/** The range that levelling may move the tone curve in. */
const GAMMA = { min: 1.3, max: 2.2 };
/** Unsharp mask that lifts shapes out of the murk, and the neighbourhood it compares against. */
const LOCAL_CONTRAST = { amount: 0.6, radius: 5 };
/** Percentiles the tone is stretched between. */
const STRETCH = { lo: 0.08, hi: 0.985 };
/**
 * The face's own treatment: local contrast within about an eye's width (radius, in pixels of the
 * art), reaching this many face widths, with a straight tone curve, since mid-tones carry the likeness.
 */
const FACE = { radius: 6, reach: 0.8, gamma: 1 };
/** Ink fades between these distances from the face, in face widths, reaching further down the body. */
const SPOTLIGHT = { inner: 1.4, outer: 5, body: 2 };

/** Half of `max-w-6xl`, the content column, capped by the window. */
export function halfColumn(width: number) {
  return Math.min(576, width / 2 - 16);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/** Soft band-pass: 1 inside [lo, hi], easing to 0 over `soft` on either side. */
function band(x: number, lo: number, hi: number, soft: number) {
  return (
    smoothstep(lo - soft, lo + soft, x) *
    (1 - smoothstep(hi - soft, hi + soft, x))
  );
}

/** Luminance and skin likelihood per pixel. */
function readArt(img: HTMLImageElement, width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const lum = new Float32Array(width * height);
  const skin = new Float32Array(width * height);
  if (!ctx) return { lum, skin };
  ctx.drawImage(img, 0, 0, width, height);
  const data = ctx.getImageData(0, 0, width, height).data;
  for (let i = 0; i < lum.length; i++) {
    const r = data[i * 4] ?? 0;
    const g = data[i * 4 + 1] ?? 0;
    const b = data[i * 4 + 2] ?? 0;
    lum[i] = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    // Painted skin sits in a small, warm corner of YCbCr; soft edges let pale and tanned both in.
    const y = 0.299 * r + 0.587 * g + 0.114 * b;
    const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
    const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
    skin[i] =
      band(cb, 77, 127, 8) * band(cr, 133, 175, 6) * smoothstep(45, 90, y);
  }
  return { lum, skin };
}

function boxRows(
  src: Float32Array,
  dst: Float32Array,
  w: number,
  h: number,
  r: number,
) {
  const span = 2 * r + 1;
  for (let y = 0; y < h; y++) {
    const row = y * w;
    let sum = 0;
    for (let x = -r; x <= r; x++) sum += src[row + clamp(x, 0, w - 1)] ?? 0;
    for (let x = 0; x < w; x++) {
      dst[row + x] = sum / span;
      sum +=
        (src[row + Math.min(w - 1, x + r + 1)] ?? 0) -
        (src[row + Math.max(0, x - r)] ?? 0);
    }
  }
}

function boxColumns(
  src: Float32Array,
  dst: Float32Array,
  w: number,
  h: number,
  r: number,
) {
  const span = 2 * r + 1;
  for (let x = 0; x < w; x++) {
    let sum = 0;
    for (let y = -r; y <= r; y++) sum += src[clamp(y, 0, h - 1) * w + x] ?? 0;
    for (let y = 0; y < h; y++) {
      dst[y * w + x] = sum / span;
      sum +=
        (src[Math.min(h - 1, y + r + 1) * w + x] ?? 0) -
        (src[Math.max(0, y - r) * w + x] ?? 0);
    }
  }
}

/** Three box blurs in a row: close enough to a Gaussian, and cheap at this size. */
function blur(src: Float32Array, w: number, h: number, radius: number) {
  const a = Float32Array.from(src);
  const b = new Float32Array(src.length);
  for (let pass = 0; pass < 3; pass++) {
    boxRows(a, b, w, h, radius);
    boxColumns(b, a, w, h, radius);
  }
  return a;
}

function percentile(values: Float32Array, p: number) {
  const sample: number[] = [];
  for (let i = 0; i < values.length; i += 3) sample.push(values[i] ?? 0);
  sample.sort((a, b) => a - b);
  return (
    sample[Math.min(sample.length - 1, Math.floor(sample.length * p))] ?? 0
  );
}

/**
 * A guess at the face for a champion missing from `FACES`: Riot frames faces top and centre, and
 * skin-coloured, detailed blobs pull the guess from there.
 */
function guessFace(
  l: Float32Array,
  skin: Float32Array,
  width: number,
  height: number,
) {
  const soft = blur(l, width, height, 1);
  const local = blur(l, width, height, 5);
  const detail = new Float32Array(l.length);
  for (let i = 0; i < l.length; i++) {
    const v = l[i] ?? 0;
    detail[i] =
      Math.abs(v - (soft[i] ?? 0)) + 0.5 * Math.abs(v - (local[i] ?? 0));
  }
  const skinBlobs = blur(skin, width, height, 4);
  const broad = blur(detail, width, height, 10);
  const detailTop = percentile(broad, 0.98) || 1;
  let best = -1;
  let fx = 0.5;
  let fy = 0.22;
  for (let y = 0; y < height * 0.55; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const u = x / width;
      const v = y / height;
      const i = y * width + x;
      const prior = Math.exp(
        -(((u - 0.5) / 0.17) ** 2 + ((v - 0.22) / 0.1) ** 2) / 2,
      );
      const sharpness = Math.min(1, (broad[i] ?? 0) / detailTop);
      const score = prior * (0.35 + (skinBlobs[i] ?? 0)) * (0.5 + sharpness);
      if (score > best) {
        best = score;
        fx = u;
        fy = v;
      }
    }
  }
  return { x: clamp(fx, 0.3, 0.7), y: clamp(fy, 0.1, 0.4) };
}

/** The gamma that brings the mean ink of `base × mask` over `region` to `target`. */
function levelGamma(
  base: Float32Array,
  mask: Float32Array,
  region: number[],
  target: number,
) {
  const mean = (g: number) => {
    let sum = 0;
    for (const i of region) sum += (base[i] ?? 0) ** g * (mask[i] ?? 0);
    return sum / Math.max(1, region.length);
  };
  let lo = GAMMA.min;
  let hi = GAMMA.max;
  for (let step = 0; step < 18; step++) {
    const mid = (lo + hi) / 2;
    if (mean(mid) > target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Reads a champion's loading-screen art, by Data Dragon id, into its ink maps. */
export function analyse(img: HTMLImageElement, championId: string): InkMap {
  const width = img.naturalWidth;
  const height = img.naturalHeight;
  const aspect = width / height;
  const { lum: l, skin } = readArt(img, width, height);

  const measured = FACES[championId];
  const focus = measured
    ? { x: measured[0], y: measured[1] }
    : guessFace(l, skin, width, height);

  // The spotlight around the face, and the region the tone curve is levelled over.
  const mask = new Float32Array(l.length);
  const region: number[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      // Offsets from the face in face widths.
      const du = (x / width - focus.x) / FACE_SHARE;
      const dv = (y / height - focus.y) / aspect / FACE_SHARE;
      const reach = Math.hypot(du, dv > 0 ? dv / SPOTLIGHT.body : dv);
      mask[i] = 1 - smoothstep(SPOTLIGHT.inner, SPOTLIGHT.outer, reach);
      if (
        y % 2 === 0 &&
        x % 2 === 0 &&
        Math.abs(du) < 1.5 &&
        dv > -0.8 &&
        dv < 2.2
      ) {
        region.push(i);
      }
    }
  }

  // Tone: brightness with its local contrast lifted, stretched to 0..1.
  const local = blur(l, width, height, LOCAL_CONTRAST.radius);
  const tone = new Float32Array(l.length);
  for (let i = 0; i < l.length; i++) {
    const v = l[i] ?? 0;
    tone[i] = v + LOCAL_CONTRAST.amount * (v - (local[i] ?? 0));
  }
  const lo = percentile(tone, STRETCH.lo);
  const hi = percentile(tone, STRETCH.hi);
  const lit = new Float32Array(l.length);
  for (let i = 0; i < l.length; i++) {
    lit[i] = clamp(((tone[i] ?? 0) - lo) / (hi - lo || 1), 0, 1);
  }

  // Around the face, add brightness relative to its neighbourhood: eyes, brows and mouth are small
  // differences in mid-tones that the tone curve would flatten. `faceWeight` also straightens the
  // curve there, below.
  const faceWeight = new Float32Array(l.length);
  const mean = blur(l, width, height, FACE.radius);
  const spread = new Float32Array(l.length);
  for (let i = 0; i < l.length; i++) {
    const d = (l[i] ?? 0) - (mean[i] ?? 0);
    spread[i] = d * d;
  }
  const variance = blur(spread, width, height, FACE.radius);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const du = (x / width - focus.x) / FACE_SHARE;
      const dv = (y / height - focus.y) / aspect / FACE_SHARE;
      const weight = Math.exp(
        -(du * du + (dv / 1.25) ** 2) / (2 * FACE.reach ** 2),
      );
      faceWeight[i] = weight;
      if (weight < 0.01) continue;
      const sigma = Math.sqrt(variance[i] ?? 0) + 0.02;
      const relative = clamp(
        0.5 + ((l[i] ?? 0) - (mean[i] ?? 0)) / (3 * sigma),
        0,
        1,
      );
      // Keep the face's overall brightness, add its local structure.
      const base = lit[i] ?? 0;
      const lifted = clamp(base + (relative - 0.5) * 0.9, 0, 1);
      lit[i] = base * (1 - weight) + lifted * weight;
    }
  }
  const shade = new Float32Array(l.length);
  for (let i = 0; i < l.length; i++) shade[i] = 1 - (lit[i] ?? 0);

  const ink = (base: Float32Array, target: number) => {
    const g = levelGamma(base, mask, region, target);
    const out = new Float32Array(base.length);
    for (let i = 0; i < out.length; i++) {
      const w = faceWeight[i] ?? 0;
      const gamma = g * (1 - w) + FACE.gamma * w;
      out[i] = Math.min(1, (base[i] ?? 0) ** gamma) * (mask[i] ?? 0);
    }
    // A dot covers a few pixels of the art: average its footprint so fine detail cannot alias.
    return blur(out, width, height, 1);
  };

  return {
    width,
    height,
    dark: ink(lit, DENSITY.dark),
    light: ink(shade, DENSITY.light),
    focus,
  };
}

/**
 * The whole figure, running the full height of the window: the art is scaled to `FILL` times the
 * window's height, the face sits in the middle of the gutter (never so close to the window's edge
 * that it is cut off), and the face's height is chosen within what keeps the art covering the
 * window from top to bottom.
 */
export function place(
  map: Pick<InkMap, "width" | "height" | "focus">,
  frame: Frame,
  slot: Slot,
): Placement {
  const column = halfColumn(frame.width);
  const gutter = frame.width / 2 - column;
  const height = frame.height * FILL;
  const width = height * (map.width / map.height);
  const face = width * FACE_SHARE;
  const fromEdge = Math.max(gutter * (0.5 - 0.12 * slot.shift), face * 0.7);
  const tx = slot.side === 1 ? frame.width - fromEdge : fromEdge;
  // Top of the art at or above the window's top, bottom at or below its bottom.
  const highest = frame.height - (1 - map.focus.y) * height;
  const lowest = map.focus.y * height;
  const ty = clamp(frame.height * slot.y, highest, Math.max(highest, lowest));
  return {
    left: tx - map.focus.x * width,
    top: ty - map.focus.y * height,
    width,
    height,
  };
}

function sampleInk(
  ink: Float32Array,
  w: number,
  h: number,
  x: number,
  y: number,
) {
  const x0 = clamp(Math.floor(x), 0, w - 2);
  const y0 = clamp(Math.floor(y), 0, h - 2);
  const ax = clamp(x - x0, 0, 1);
  const ay = clamp(y - y0, 0, 1);
  const i = y0 * w + x0;
  const top = (ink[i] ?? 0) * (1 - ax) + (ink[i + 1] ?? 0) * ax;
  const bottom = (ink[i + w] ?? 0) * (1 - ax) + (ink[i + w + 1] ?? 0) * ax;
  return top * (1 - ay) + bottom * ay;
}

/**
 * Screens the ink map into dots. The screen is anchored at the face and turned 45°; a dot's area,
 * not its radius, follows the ink, as on a printing plate. The dots fade out over the art's edges,
 * down the body, and under the content column.
 */
export function screen(
  map: InkMap,
  placement: Placement,
  frame: Frame,
  dark: boolean,
): Dot[] {
  const ink = dark ? map.dark : map.light;
  const column = halfColumn(frame.width);
  const middle = frame.width / 2;
  const faceX = placement.left + map.focus.x * placement.width;
  const faceY = placement.top + map.focus.y * placement.height;
  const reach = Math.hypot(placement.width, placement.height) * 0.7;

  const x0 = Math.max(placement.left, 0);
  const x1 = Math.min(placement.left + placement.width, frame.width);
  const y0 = Math.max(placement.top, 0);
  const y1 = Math.min(placement.top + placement.height, frame.height);
  if (x1 <= x0 || y1 <= y0) return [];

  const step = CELL * Math.SQRT1_2;
  const a0 = (x0 - faceX) / step;
  const a1 = (x1 - faceX) / step;
  const b0 = (y0 - faceY) / step;
  const b1 = (y1 - faceY) / step;

  const dots: Dot[] = [];
  for (let i = Math.floor((a0 + b0) / 2); i <= Math.ceil((a1 + b1) / 2); i++) {
    for (
      let j = Math.floor((b0 - a1) / 2);
      j <= Math.ceil((b1 - a0) / 2);
      j++
    ) {
      const x = faceX + (i - j) * step;
      const y = faceY + (i + j) * step;
      if (x < x0 || x > x1 || y < y0 || y > y1) continue;

      const u = (x - placement.left) / placement.width;
      const v = (y - placement.top) / placement.height;
      const edge =
        smoothstep(0, 0.07, u) *
        smoothstep(0, 0.07, 1 - u) *
        smoothstep(0, 0.06, v) *
        smoothstep(0, 0.05, 1 - v);
      const beside = smoothstep(
        column - UNDER_COLUMN,
        column + 24,
        Math.abs(x - middle),
      );
      // Light falls off down the body, so the face stays the brightest thing in the portrait.
      const body =
        1 -
        0.4 *
          smoothstep(
            faceY + placement.height * 0.1,
            faceY + placement.height * 0.7,
            y,
          );
      const coverage =
        sampleInk(
          ink,
          map.width,
          map.height,
          u * map.width - 0.5,
          v * map.height - 0.5,
        ) *
        edge *
        beside *
        body;

      const r = CELL * Math.sqrt((COVERAGE * Math.min(1, coverage)) / Math.PI);
      if (r < 0.45) continue;

      const away =
        Math.atan2(y - faceY, x - faceX) + (Math.random() - 0.5) * 1.4;
      const drift = 3 + Math.random() * 9;
      const fromFace = Math.min(1, Math.hypot(x - faceX, y - faceY) / reach);
      dots.push({
        x,
        y,
        r,
        delay: fromFace * JITTER * 0.65 + Math.random() * JITTER * 0.35,
        dx: Math.cos(away) * drift,
        dy: Math.sin(away) * drift,
      });
    }
  }
  return dots;
}
