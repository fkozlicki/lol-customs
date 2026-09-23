import { Icons } from "@v1/ui/icons";

/**
 * Derby's vocabulary, drawn with the shared icons.
 *
 * `@v1/ui` stays neutral — it names icons after what they depict, not after what Derby uses them
 * for. The mapping from a domain term in CONTEXT.md to a picture belongs here, in the app that has
 * the domain.
 */
export const DerbyIcons = {
  /** Season standings. */
  Leaderboard: Icons.Trophy,
  /** A Match. */
  Matches: Icons.Swords,
  /** Hall of Fame. */
  HallOfFame: Icons.Crown,
  /** The shuffle that produces a Team. */
  Shuffle: Icons.Shuffle,
  Auction: Icons.Gavel,
  /** The captain of a Team in an auction. */
  Captain: Icons.Crown,
  /** Overflow in the mobile navigation. */
  More: Icons.Ellipsis,
} as const;
