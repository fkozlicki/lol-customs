import type { PickablePlayerView } from "./pickable-player-view";
import { PickedPlayerRow } from "./picked-player-row";

interface PickedPlayersProps {
  title: string;
  /** What the list says while nobody is picked. */
  emptyHint: string;
  removeLabel: string;
  players: PickablePlayerView[];
  onRemove: (key: string) => void;
}

/** The players picked so far, in the order they were added. */
export function PickedPlayers({
  title,
  emptyHint,
  removeLabel,
  players,
  onRemove,
}: PickedPlayersProps) {
  return (
    <section>
      <h2 className="label-caps pb-3 text-foreground">{title}</h2>
      {players.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyHint}</p>
      ) : (
        <ul className="divide-y">
          {players.map((player) => (
            <PickedPlayerRow
              key={player.key}
              player={player}
              removeLabel={removeLabel}
              onRemove={() => onRemove(player.key)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
