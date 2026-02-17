"use client";

import { Alert, AlertDescription, AlertTitle } from "@v1/ui/alert";
import { Badge } from "@v1/ui/badge";
import { Button } from "@v1/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@v1/ui/dialog";
import { Icons } from "@v1/ui/icons";
import { cn } from "@v1/ui/cn";
import { useCallback, useEffect, useState } from "react";
import { LolStatus } from "@/app/lol-status";

type GameForUi = {
  gameId: number;
  gameCreation?: number;
  duration?: number;
  queueId: number;
  isSaved: boolean;
};

type ResultState =
  | { type: "idle" }
  | { type: "success"; message: string; saved: number }
  | { type: "error"; message: string; errors?: string[] };

function truncatePath(p: string, maxLen = 44): string {
  if (p.length <= maxLen) return p;
  return `…${p.slice(-maxLen + 1)}`;
}

function formatGameDate(ts?: number): string {
  if (ts == null) return "—";
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDuration(sec?: number): string {
  if (sec == null) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function Home() {
  const [config, setConfig] = useState<{
    lolDirectory: string | null;
    detected: string | null;
    effectiveDirectory: string | null;
    available: boolean;
  } | null>(null);
  const [games, setGames] = useState<GameForUi[] | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<ResultState>({ type: "idle" });
  const [folderError, setFolderError] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  const refreshConfig = useCallback(() => {
    if (typeof window === "undefined" || !window.lcu) return;
    setFolderError(null);
    window.lcu.getConfig().then(setConfig);
  }, []);

  useEffect(() => {
    refreshConfig();
  }, [refreshConfig]);

  const handleChooseFolder = async () => {
    if (!window.lcu) return;
    setFolderError(null);
    const r = await window.lcu.openFolderDialog();
    if (r.success) {
      refreshConfig();
    } else if (r.error !== "No folder selected") {
      setFolderError(r.error);
    }
  };

  const handleFetchGames = async (isRefresh = false) => {
    if (!window.lcu?.fetchGames || fetching) return;
    setFetching(true);
    if (!isRefresh) {
      setResult({ type: "idle" });
      setSelectedIds(new Set());
    }
    setFolderError(null);
    setGames(null);
    try {
      const r = await window.lcu.fetchGames();
      if (r.success) {
        setGames(r.games);
      } else {
        setResult({ type: "error", message: r.error });
      }
    } catch (e) {
      setResult({
        type: "error",
        message: e instanceof Error ? e.message : "Fetch failed",
      });
    } finally {
      setFetching(false);
    }
  };

  const toggleSelection = (gameId: number, isSaved: boolean) => {
    if (isSaved) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(gameId)) next.delete(gameId);
      else next.add(gameId);
      return next;
    });
  };

  const selectAllUnsaved = () => {
    if (!games) return;
    const unsaved = games.filter((g) => !g.isSaved).map((g) => g.gameId);
    setSelectedIds(new Set(unsaved));
  };

  const handleSaveSelected = async () => {
    if (!window.lcu?.saveSelectedMatches || saving || selectedIds.size === 0)
      return;
    setSaving(true);
    setResult({ type: "idle" });
    setFolderError(null);
    try {
      const r = await window.lcu.saveSelectedMatches([...selectedIds]);
      if (r.success) {
        setResult({
          type: "success",
          message: r.message,
          saved: r.savedCount ?? 0,
        });
        setSelectedIds(new Set());
        await handleFetchGames(true);
      } else {
        setResult({
          type: "error",
          message: r.message,
          errors: r.errors,
        });
      }
    } catch (e) {
      setResult({
        type: "error",
        message: e instanceof Error ? e.message : "Save failed",
      });
    } finally {
      setSaving(false);
    }
  };

  const path = config?.effectiveDirectory ?? null;
  const canFetch = path && config?.available && !fetching;
  const unsavedCount = games?.filter((g) => !g.isSaved).length ?? 0;
  const canSaveSelected =
    path &&
    config?.available &&
    !saving &&
    selectedIds.size > 0 &&
    games != null;

  return (
    <main className="relative flex min-h-full flex-col bg-background p-5 text-foreground">
      <header className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">Rift Rank LCU</h1>
        {config !== null && (
          <LolStatus hasFolder={!!path} isRunning={config.available} />
        )}
      </header>

      <div className="mt-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="default" onClick={handleChooseFolder}>
            <Icons.Folder className="size-4 shrink-0" />
            {path ? "Change folder" : "Select League folder"}
          </Button>
          {path && (
            <span className="font-mono text-xs text-muted-foreground">
              {truncatePath(path)}
            </span>
          )}
        </div>

        {folderError && (
          <Alert variant="destructive">
            <AlertDescription>{folderError}</AlertDescription>
          </Alert>
        )}
      </div>

      <Button
        className="mt-5 w-full"
        size="lg"
        onClick={() => void handleFetchGames(false)}
        disabled={!canFetch}
      >
        {fetching ? (
          <>
            <Icons.Loader className="size-4 animate-spin" />
            Loading…
          </>
        ) : (
          "Fetch games"
        )}
      </Button>

      {games != null && games.length === 0 && (
        <p className="mt-3 text-sm text-muted-foreground">
          No custom games found in match history.
        </p>
      )}

      {games != null && games.length > 0 && (
        <div className="mt-4 flex flex-1 flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">Custom games</span>
            {unsavedCount > 0 && (
              <button
                type="button"
                onClick={selectAllUnsaved}
                className="text-xs text-muted-foreground underline hover:text-foreground"
              >
                Select all ({unsavedCount})
              </button>
            )}
          </div>
          <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto rounded-md border border-border p-2">
            {games.map((game) => (
              <li
                key={game.gameId}
                className={cn(
                  "flex items-center justify-between gap-2 rounded px-2 py-1.5 text-sm",
                  game.isSaved && "bg-muted/50",
                )}
              >
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <input
                    type="checkbox"
                    id={`game-${game.gameId}`}
                    checked={selectedIds.has(game.gameId)}
                    disabled={game.isSaved}
                    onChange={() => toggleSelection(game.gameId, game.isSaved)}
                    className="size-4 shrink-0 rounded border-input"
                  />
                  <label
                    htmlFor={game.isSaved ? undefined : `game-${game.gameId}`}
                    className={cn(
                      "min-w-0 flex-1 cursor-default text-left",
                      game.isSaved && "cursor-default",
                    )}
                  >
                    <span className="font-mono text-muted-foreground">
                      #{game.gameId}
                    </span>{" "}
                    {formatGameDate(game.gameCreation)} ·{" "}
                    {formatDuration(game.duration)}
                  </label>
                </div>
                {game.isSaved ? (
                  <Badge variant="secondary">Saved</Badge>
                ) : null}
              </li>
            ))}
          </ul>
          <Button
            className="w-full"
            size="default"
            onClick={handleSaveSelected}
            disabled={!canSaveSelected}
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
      )}

      {result.type === "success" && (
        <Alert className="mt-4 border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400">
          <AlertTitle>{result.message}</AlertTitle>
          {result.saved > 0 && (
            <AlertDescription>
              {result.saved} match{result.saved === 1 ? "" : "es"} saved.
            </AlertDescription>
          )}
        </Alert>
      )}
      {result.type === "error" && (
        <Alert variant="destructive" className="mt-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {result.message}
            {result.errors && result.errors.length > 0 && (
              <ul className="mt-2 list-inside list-disc text-xs">
                {result.errors.slice(0, 5).map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
                {result.errors.length > 5 && (
                  <li>…and {result.errors.length - 5} more</li>
                )}
              </ul>
            )}
          </AlertDescription>
        </Alert>
      )}

      <button
        type="button"
        onClick={() => setHelpOpen(true)}
        className="fixed bottom-4 right-4 flex size-10 items-center justify-center rounded-lg bg-black text-white shadow-md transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label="Help"
      >
        <Icons.HelpCircle className="size-5" />
      </button>

      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>How it works</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 text-left text-sm text-muted-foreground">
                <p>
                  This app syncs your <strong>custom game</strong> match history
                  from the League client to Rift Rank. It uses the same client
                  (Riot Games) that runs when you play League.
                </p>
                <p>
                  <strong>What you do:</strong> Select your League of Legends
                  install folder once. When the League client is running and
                  you’re logged in, tap “Fetch games”. Choose which games to
                  save, then tap “Save selected”. Already saved games are marked
                  and cannot be saved again.
                </p>
                <p>
                  The status badge shows whether the client is running. Fetch and
                  save only work when the client is open and you’re logged in.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </main>
  );
}
