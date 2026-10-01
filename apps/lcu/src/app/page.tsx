"use client";

import { Button } from "@v1/ui/button";
import { Icons } from "@v1/ui/icons";
import { LolStatus } from "@/app/lol-status";
import { FolderPicker } from "./folder-picker";
import { GameList } from "./game-list";
import { HelpDialog } from "./help-dialog";
import { SaveResultAlert } from "./save-result-alert";
import { useGameSync } from "./use-game-sync";

export default function Home() {
  const sync = useGameSync();

  return (
    <main className="relative flex min-h-full flex-col bg-background p-5 text-foreground">
      <header className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">Niunio</h1>
        {sync.config !== null && (
          <LolStatus
            hasFolder={!!sync.path}
            isRunning={sync.config.available}
          />
        )}
      </header>

      <FolderPicker
        path={sync.path}
        error={sync.folderError}
        onChoose={sync.chooseFolder}
      />

      <Button
        className="mt-5 w-full"
        size="lg"
        onClick={() => void sync.fetchGames(false)}
        disabled={!sync.canFetch}
      >
        {sync.fetching ? (
          <>
            <Icons.Loader className="size-4 animate-spin" />
            Loading…
          </>
        ) : (
          "Fetch games"
        )}
      </Button>

      {sync.games != null && sync.games.length === 0 && (
        <p className="mt-3 text-sm text-muted-foreground">
          No custom games found in match history.
        </p>
      )}

      {sync.games != null && sync.games.length > 0 && (
        <GameList
          games={sync.games}
          selectedIds={sync.selectedIds}
          onToggle={sync.toggle}
          onSelectAllUnsaved={sync.selectAllUnsaved}
          patch={sync.patch}
          canSave={sync.canSave}
          saving={sync.saving}
          onSave={sync.saveSelected}
        />
      )}

      <SaveResultAlert result={sync.result} />

      <HelpDialog />
    </main>
  );
}
