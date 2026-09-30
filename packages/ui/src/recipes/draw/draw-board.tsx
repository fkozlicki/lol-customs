"use client";

import { DrawRoster } from "./draw-roster";
import { DrawToolbar } from "./draw-toolbar";
import type { DrawnTeamView, DrawPlayerView } from "./draw-view";
import { DrawnTeam } from "./drawn-team";
import { LadderPicker } from "./ladder-picker";
import { RiotIdField } from "./riot-id-field";

interface DrawBoardProps {
  /** The two drawn teams, once drawn. */
  teams: { a: DrawnTeamView; b: DrawnTeamView } | null;
  roster: DrawPlayerView[];
  /** How many players a draw needs. */
  size: number;
  candidates: DrawPlayerView[];
  search: string;
  onSearchChange: (search: string) => void;
  riotId: string;
  onRiotIdChange: (riotId: string) => void;
  onAdd: (key: string) => void;
  onAddRiotId: () => void;
  onRemove: (key: string) => void;
  onClear: () => void;
  onDraw: () => void;
}

/**
 * The draw: once ten players are on the roster, split them into two teams at random — sides, roles
 * and captains included. The teams show on top; the roster and the ways to fill it below.
 */
export function DrawBoard({
  teams,
  roster,
  size,
  candidates,
  search,
  onSearchChange,
  riotId,
  onRiotIdChange,
  onAdd,
  onAddRiotId,
  onRemove,
  onClear,
  onDraw,
}: DrawBoardProps) {
  const full = roster.length >= size;

  return (
    <div className="space-y-10">
      {teams && (
        <section className="grid gap-10 md:grid-cols-2 md:gap-16">
          <DrawnTeam team="a" view={teams.a} />
          <DrawnTeam team="b" view={teams.b} />
        </section>
      )}

      <DrawToolbar
        count={roster.length}
        size={size}
        drawn={teams != null}
        onClear={onClear}
        onDraw={onDraw}
      />

      <div className="grid gap-10 md:grid-cols-2 md:gap-16">
        <DrawRoster roster={roster} onRemove={onRemove} />
        <section className="space-y-6">
          <LadderPicker
            players={candidates}
            search={search}
            onSearchChange={onSearchChange}
            onAdd={onAdd}
            full={full}
          />
          <RiotIdField
            value={riotId}
            onChange={onRiotIdChange}
            onAdd={onAddRiotId}
            disabled={full}
          />
        </section>
      </div>
    </div>
  );
}
