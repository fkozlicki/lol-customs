import { useId } from "react";
import { Input } from "../../components/input";
import { LadderPlayerRow } from "./ladder-player-row";
import type { PickablePlayerView } from "./pickable-player-view";

/** A long ladder would be a long page; the search narrows it past this many. */
const SHOWN = 80;

interface LadderPickerProps {
  title: string;
  searchPlaceholder: string;
  /** What an empty list says with no search typed. */
  emptyLabel: string;
  /** What it says when the search matches nobody. */
  noResultsLabel: string;
  addLabel: string;
  /** Ladder players not picked yet, already filtered by the search. */
  players: PickablePlayerView[];
  search: string;
  onSearchChange: (search: string) => void;
  onAdd: (key: string) => void;
  /** Nothing more can be picked. */
  full: boolean;
}

/** Picks players from the ladder by name. */
export function LadderPicker({
  title,
  searchPlaceholder,
  emptyLabel,
  noResultsLabel,
  addLabel,
  players,
  search,
  onSearchChange,
  onAdd,
  full,
}: LadderPickerProps) {
  const headingId = useId();

  return (
    <div>
      <h2 id={headingId} className="label-caps pb-3 text-foreground">
        {title}
      </h2>
      <Input
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={searchPlaceholder}
        aria-label={searchPlaceholder}
      />
      <ul
        // biome-ignore lint/a11y/noNoninteractiveTabindex: a scrolling region has to be reachable from the keyboard even when every add button is disabled (WCAG 2.1.1, axe scrollable-region-focusable)
        tabIndex={0}
        aria-labelledby={headingId}
        className="mt-2 max-h-72 divide-y overflow-y-auto"
      >
        {players.length === 0 ? (
          <li className="py-4 text-sm text-muted-foreground">
            {search.trim() ? noResultsLabel : emptyLabel}
          </li>
        ) : (
          players
            .slice(0, SHOWN)
            .map((player) => (
              <LadderPlayerRow
                key={player.key}
                player={player}
                addLabel={addLabel}
                disabled={full}
                onAdd={() => onAdd(player.key)}
              />
            ))
        )}
      </ul>
    </div>
  );
}
