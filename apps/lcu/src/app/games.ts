import type { GameForUi } from "@/electron-api";

export type GameStats = GameForUi["match"]["participants"][number]["stats"];

/** What the last save did: nothing yet, how many it saved, or what went wrong. */
export type SaveResult =
  | { type: "idle" }
  | { type: "success"; message: string; saved: number }
  | { type: "error"; message: string; errors?: string[] };

const ITEM_SLOTS = [
  "item0",
  "item1",
  "item2",
  "item3",
  "item4",
  "item5",
  "item6",
] as const;

/** The seven item slots, in order; an empty slot is undefined. */
export function itemIds(stats: GameStats): (number | undefined)[] {
  return ITEM_SLOTS.map((slot) => stats[slot]);
}

/** Minions and jungle monsters together. */
export function creepScore(
  stats: Pick<GameStats, "totalMinionsKilled" | "neutralMinionsKilled">,
): number {
  return (stats.totalMinionsKilled ?? 0) + (stats.neutralMinionsKilled ?? 0);
}

export function formatDuration(seconds?: number): string {
  if (seconds == null) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatGameDate(timestamp?: number): string {
  if (timestamp == null) return "—";
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

/** Keeps the end of a long path, where the folder's own name is. */
export function truncatePath(path: string, maxLength = 44): string {
  if (path.length <= maxLength) return path;
  return `…${path.slice(-maxLength + 1)}`;
}
