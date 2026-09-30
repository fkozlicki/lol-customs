import type { TeamRole } from "@v1/game-assets/urls";
import type { PickablePlayerView } from "../player-picker/pickable-player-view";

/**
 * A draw as its recipes draw it. The app makes these from the ladder's players and
 * `@v1/domain/shuffle`'s result (apps/app/src/components/draw/draw-view.ts).
 */

/** A player on the roster, or on the ladder waiting to be picked. */
export type DrawPlayerView = PickablePlayerView;

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
