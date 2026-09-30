import type { TeamRole } from "@v1/game-assets/urls";

/**
 * A draw as its recipes draw it. The app makes these from the ladder's players and
 * `@v1/domain/shuffle`'s result (apps/app/src/components/draw/draw-view.ts).
 */

/** A player on the roster, or on the ladder waiting to be picked. */
export interface DrawPlayerView {
  /** The Riot ID, normalised: unique on the roster. */
  key: string;
  name: string;
  rankTier: string | null;
  /** "gold iv"; null when unranked, which the row says in the reader's language. */
  rankLabel: string | null;
}

/** A player in a drawn team, with the role and captaincy the draw gave them. */
export interface DrawnPlayerView extends DrawPlayerView {
  role: TeamRole;
  isCaptain: boolean;
}

export interface DrawnTeamView {
  /** The team's average rank, as a crest and a label; unranked players are left out of it. */
  avgRankTier: string | null;
  avgRankLabel: string;
  players: DrawnPlayerView[];
}
