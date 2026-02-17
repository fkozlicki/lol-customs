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

function formatDuration(sec?: number): string {
  if (sec == null) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatGameDateShort(ts?: number): string {
  if (ts == null) return "—";
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

interface GameCardProps {
  game: GameForUi;
  isSelected: boolean;
  onToggle: () => void;
}

function GameCard({ game, isSelected, onToggle }: GameCardProps) {
  const isSaved = game.isSaved;
  return (
    <article
      className={cn(
        "relative flex w-full items-stretch gap-3 overflow-hidden rounded-none border-x-0 border-b border-t-0 border-zinc-700/50 bg-zinc-900/95 px-3 py-2.5",
        isSaved && "opacity-80",
      )}
    >
      {/* Gold accent lines (top and bottom) */}
      <div className="absolute left-0 right-0 top-0 h-px bg-linear-to-r from-transparent via-amber-500/50 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-amber-500/30 to-transparent" />

      {/* Left: checkbox (replaces champion area for selection) + outcome/mode */}
      <div className="flex shrink-0 items-start gap-2 pt-0.5">
        <div className="flex flex-col items-center gap-1">
          <input
            type="checkbox"
            id={`game-${game.gameId}`}
            checked={isSelected}
            disabled={isSaved}
            onChange={onToggle}
            className="size-4 shrink-0 rounded border-amber-500/50 bg-zinc-800 text-amber-500 focus:ring-amber-500/50"
          />
          <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-amber-500/30 bg-zinc-800">
            <Icons.Square className="size-5 text-amber-500/50" />
          </div>
        </div>
        <div className="flex flex-col gap-0.5">
          <span
            className={cn(
              "text-xs font-bold uppercase tracking-wide",
              isSaved ? "text-zinc-500" : "text-cyan-400",
            )}
          >
            {isSaved ? "Saved" : "Custom"}
          </span>
          <span className="text-[11px] text-zinc-500">Custom</span>
        </div>
      </div>

      {/* Middle: placeholder stats row (same layout as reference) */}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="size-7 shrink-0 rounded border border-amber-500/20 bg-zinc-800/80"
            />
          ))}
        </div>
        <div className="flex items-center gap-3 text-xs text-zinc-400">
          <span>— / — / —</span>
          <span className="flex items-center gap-0.5">
            — <Icons.Minus className="size-3 text-zinc-500" />
          </span>
          <span className="flex items-center gap-0.5">
            — <Icons.Minus className="size-3 text-zinc-500" />
          </span>
        </div>
      </div>

      {/* Right: rune placeholder, map, duration, date + Saved badge */}
      <div className="flex shrink-0 items-center gap-2">
        <div className="size-8 shrink-0 rounded border border-amber-500/20 bg-zinc-800/80" />
        <div className="flex flex-col items-end justify-center gap-0.5">
          <span className="text-xs text-zinc-400">Summoner&apos;s Rift</span>
          <span className="text-[11px] text-zinc-500">
            {formatDuration(game.duration)}
            <span className="mx-1 text-zinc-600">·</span>
            {formatGameDateShort(game.gameCreation)}
          </span>
          {isSaved && (
            <Badge
              variant="secondary"
              className="mt-1 border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400"
            >
              Saved
            </Badge>
          )}
        </div>
      </div>
    </article>
  );
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
          <ul className="flex max-h-80 flex-col overflow-y-auto rounded-md border border-border bg-zinc-950/50">
            {games.map((game) => (
              <li key={game.gameId}>
                <GameCard
                  game={game}
                  isSelected={selectedIds.has(game.gameId)}
                  onToggle={() => toggleSelection(game.gameId, game.isSaved)}
                />
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
