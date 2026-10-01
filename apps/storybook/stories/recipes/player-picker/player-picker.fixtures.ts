/** Players shaped the way the player picker takes them. Names invented. */
import type { PickablePlayerView } from "@v1/ui/recipes/player-picker/pickable-player-view";

const player = (
  name: string,
  rankTier: string | null,
  rankLabel: string | null,
): PickablePlayerView => ({
  key: name.toLowerCase(),
  name,
  rankTier,
  rankLabel,
});

export const PLAYERS: PickablePlayerView[] = [
  player("Kestrel", "diamond", "diamond IV"),
  player("Old Tom", "emerald", "emerald I"),
  player("Nightjar", null, null),
  player("Sutokopter", "emerald", "emerald II"),
  player("Wren", "gold", "gold I"),
  player("Bramble", "platinum", "platinum III"),
  player("Quill", "master", "master"),
  player("Emberly", "silver", "silver II"),
  player("Patologia", "diamond", "diamond II"),
  player("Lana", "emerald", "emerald III"),
  player("Ayuni", null, null),
  player("Chicharito", "gold", "gold IV"),
];
