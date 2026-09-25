import { describe, expect, test } from "bun:test";
import { CHAMPIONS } from "@/game-data/champions";
import { FACES } from "./faces";
import {
  CELL,
  halfColumn,
  type InkMap,
  place,
  screen,
  UNDER_COLUMN,
} from "./halftone";

/** A loading-screen art's size, with the ink the same everywhere. */
function inkMap(focus: { x: number; y: number }, ink = 1): InkMap {
  const width = 308;
  const height = 560;
  return {
    width,
    height,
    focus,
    dark: new Float32Array(width * height).fill(ink),
    light: new Float32Array(width * height).fill(ink),
  };
}

const WINDOW = { width: 1600, height: 1000 };
const gutter = (width: number) => width / 2 - halfColumn(width);

describe("placing a portrait", () => {
  test("puts the face in the middle of the gutter, on either side", () => {
    const map = inkMap({ x: 0.45, y: 0.22 });
    const right = place(map, WINDOW, { side: 1, y: 0.3, shift: 0 });
    const left = place(map, WINDOW, { side: -1, y: 0.3, shift: 0 });

    expect(right.left + map.focus.x * right.width).toBeCloseTo(
      WINDOW.width - gutter(WINDOW.width) / 2,
    );
    expect(left.left + map.focus.x * left.width).toBeCloseTo(
      gutter(WINDOW.width) / 2,
    );
  });

  test("runs the figure the full height of the window, wherever the face is", () => {
    for (const faceY of [0.1, 0.22, 0.4]) {
      for (const slotY of [0, 0.3, 1]) {
        const placement = place(inkMap({ x: 0.5, y: faceY }), WINDOW, {
          side: 1,
          y: slotY,
          shift: 0,
        });
        expect(placement.top).toBeLessThanOrEqual(0);
        expect(placement.top + placement.height).toBeGreaterThanOrEqual(
          WINDOW.height,
        );
      }
    }
  });

  test("keeps the whole face on screen when the gutter is narrow", () => {
    const narrow = { width: 1280, height: 800 };
    const map = inkMap({ x: 0.5, y: 0.22 });
    const placement = place(map, narrow, { side: 1, y: 0.3, shift: 0 });
    const face = placement.width * 0.2;
    const faceX = placement.left + map.focus.x * placement.width;

    expect(narrow.width - faceX).toBeGreaterThanOrEqual(face / 2);
  });
});

describe("screening a portrait", () => {
  const map = inkMap({ x: 0.45, y: 0.22 });
  const placement = place(map, WINDOW, { side: 1, y: 0.3, shift: 0 });
  const dots = screen(map, placement, WINDOW, true);

  test("never draws under the content column, beyond the fade at its edge", () => {
    expect(dots.length).toBeGreaterThan(0);
    const column = halfColumn(WINDOW.width);
    for (const dot of dots) {
      expect(Math.abs(dot.x - WINDOW.width / 2)).toBeGreaterThan(
        column - UNDER_COLUMN,
      );
    }
  });

  test("keeps every dot inside the window and inside its cell", () => {
    for (const dot of dots) {
      expect(dot.x).toBeGreaterThanOrEqual(0);
      expect(dot.x).toBeLessThanOrEqual(WINDOW.width);
      expect(dot.y).toBeGreaterThanOrEqual(0);
      expect(dot.y).toBeLessThanOrEqual(WINDOW.height);
      expect(dot.r * 2).toBeLessThan(CELL);
    }
  });

  test("draws nothing where the art has no ink", () => {
    expect(screen(inkMap(map.focus, 0), placement, WINDOW, true)).toEqual([]);
  });
});

describe("measured faces", () => {
  test("are keyed by champions that exist, and lie inside the art", () => {
    const ids = new Set(
      Object.values(CHAMPIONS).map((champion) =>
        champion.image.replace(/\.png$/, ""),
      ),
    );
    for (const [id, [x, y]] of Object.entries(FACES)) {
      expect(ids.has(id), id).toBe(true);
      expect(x).toBeGreaterThan(0);
      expect(x).toBeLessThan(1);
      expect(y).toBeGreaterThan(0);
      expect(y).toBeLessThan(1);
    }
  });
});
