import { Icons as SharedIcons } from "@v1/ui/icons";

/**
 * Every icon the app uses, under one name.
 *
 * `@v1/ui` stays neutral: it names icons after what they depict, because Derby Sync draws from the
 * same set for its own purposes. The Derby names sit on top here, so a component imports icons once
 * and the mapping from a CONTEXT.md term to a picture has a single home.
 */
export const Icons = {
  ...SharedIcons,
  /** Season standings. */
  Leaderboard: SharedIcons.Trophy,
  /** A Match. */
  Matches: SharedIcons.Swords,
  /** Hall of Fame. */
  HallOfFame: SharedIcons.Crown,
  Auction: SharedIcons.Gavel,
  /** The captain of a Team in an auction. */
  Captain: SharedIcons.Crown,
  /** Overflow in the mobile navigation. */
  More: SharedIcons.Ellipsis,
} as const;

export type { LucideIcon } from "@v1/ui/icons";
