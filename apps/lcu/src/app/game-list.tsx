"use client";

import { Button } from "@v1/ui/button";
import { Icons } from "@v1/ui/icons";
import type { GameForUi } from "@/electron-api";
import { GameCard } from "./game-card";

interface GameListProps {
  games: GameForUi[];
  selectedIds: Set<number>;
  onToggle: (game: GameForUi) => void;
  onSelectAllUnsaved: () => void;
  patch: string;
  canSave: boolean;
  saving: boolean;
  onSave: () => void;
}

/** The custom games found, to tick and save; saved ones stay listed but cannot be ticked. */
export function GameList({
  games,
  selectedIds,
  onToggle,
  onSelectAllUnsaved,
  patch,
  canSave,
  saving,
  onSave,
}: GameListProps) {
  const unsavedCount = games.filter((game) => !game.isSaved).length;

  return (
    <div className="mt-4 flex flex-1 flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">Custom games</span>
        {unsavedCount > 0 && (
          <button
            type="button"
            onClick={onSelectAllUnsaved}
            className="text-xs text-muted-foreground underline hover:text-foreground"
          >
            Select all ({unsavedCount})
          </button>
        )}
      </div>
      <ul className="flex max-h-80 flex-col overflow-y-auto rounded-md border border-border bg-zinc-950/50">
        {games.map((game) => (
          <li key={game.match.gameId}>
            <GameCard
              game={game}
              isSelected={selectedIds.has(game.match.gameId)}
              onToggle={() => onToggle(game)}
              patch={patch}
            />
          </li>
        ))}
      </ul>
      <Button
        className="w-full"
        size="default"
        onClick={onSave}
        disabled={!canSave}
      >
        {saving ? (
          <>
            <Icons.Loader className="size-4 animate-spin" />
            Saving…
          </>
        ) : (
          `Save selected (${selectedIds.size})`
        )}
      </Button>
    </div>
  );
}
