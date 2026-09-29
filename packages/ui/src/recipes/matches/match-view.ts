import type { Side } from "../game-assets/asset-urls";

/**
 * A match as the match recipes draw it: every value already derived, formatted where formatting
 * needs the domain, and every link built. The app makes one from a `matches.list` row with
 * `toMatchCardView` (apps/app/src/components/matches/match-view.ts); stories make one by hand.
 *
 * Numbers that are only displayed stay numbers — a recipe renders them with `num` and
 * `toLocaleString`. What needs Derby's rules to compute — a KDA ratio, a rank label, who is MVP, a
 * player's place in the match — arrives computed.
 */
export interface MatchCardView {
  id: number;
  /** "35:51". */
  duration: string;
  /** ISO timestamp the match was created, shown as how long ago. */
  createdAt: string;
  blue: SideView;
  red: SideView;
  /** The profile owner's line when the card is told from their point of view; null in the list. */
  player: ParticipantView | null;
  mvp: ParticipantView | null;
  ace: ParticipantView | null;
}

export interface SideView {
  side: Side;
  won: boolean;
  kills: number;
  gold: number;
  objectives: ObjectivesView;
  participants: ParticipantView[];
}

export interface ObjectivesView {
  baronKills: number;
  dragonKills: number;
  heraldKills: number;
  inhibitorKills: number;
  towerKills: number;
}

/** One player's line in a match. */
export interface ParticipantView {
  /** Stable across renders; the player's puuid. */
  key: string;
  name: string;
  /** Their profile, with the season carried; "#" when the Riot ID is unknown. */
  href: string;
  side: Side;
  win: boolean;
  /** Null for a champion the match did not record; the image shows its placeholder. */
  championId: number | null;
  level: number | null;
  /** The summoner spells actually taken, in slot order; empty slots left out. */
  spellIds: number[];
  /** Six items and the trinket, in slot order; null keeps an empty square. */
  itemIds: (number | null)[];
  rankTier: string | null;
  /** "gold iv", "master"; null when unranked, which the recipe translates. */
  rankLabel: string | null;
  kills: number;
  deaths: number;
  assists: number;
  /** "3.14:1"; null for a perfect KDA (no deaths), which the recipe translates. */
  kdaRatio: string | null;
  /** Kills and assists as a share of the side's kills, 0–100. */
  killParticipation: number;
  opScore: number | null;
  /** Place by OP score across the match, from 1; null without a score. */
  place: number | null;
  badge: "mvp" | "ace" | null;
  damageDealt: number;
  damageTaken: number;
  /** Against the highest in the match, 0–100: what the damage bars draw. */
  damageDealtShare: number;
  damageTakenShare: number;
  wardsPlaced: number;
  wardsKilled: number;
  cs: number;
  csPerMinute: number;
  ratingChange: number | null;
}
