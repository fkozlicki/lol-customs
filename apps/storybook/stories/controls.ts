/**
 * How the Controls panel edits props it would otherwise edit badly.
 *
 * A slot takes a React node that the app fills with a container, so the panel would offer a raw JSON
 * editor for it. `slots()` switches its control off; its row stays in the docs table with its type.
 */
export function slots<const T extends string>(...names: T[]) {
  return Object.fromEntries(
    names.map((name) => [name, { control: false }]),
  ) as Record<T, { control: false }>;
}

/** A number the panel edits with a slider between sensible bounds. */
export function range(min: number, max: number, step = 1) {
  return { control: { type: "range" as const, min, max, step } };
}

/** Every rank tier Riot has, plus null for a player with no rank on record. */
export const TIERS = [
  "IRON",
  "BRONZE",
  "SILVER",
  "GOLD",
  "PLATINUM",
  "EMERALD",
  "DIAMOND",
  "MASTER",
  "GRANDMASTER",
  "CHALLENGER",
  null,
];

/** A tier, chosen from the list rather than typed. */
export const tierControl = { control: "select" as const, options: TIERS };
