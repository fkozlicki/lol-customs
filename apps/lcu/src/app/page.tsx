"use client";

import { Alert, AlertDescription, AlertTitle } from "@v1/ui/alert";
import { Button } from "@v1/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@v1/ui/dialog";
import { Icons } from "@v1/ui/icons";
import { useCallback, useEffect, useState } from "react";
import { LolStatus } from "@/app/lol-status";

type ResultState =
  | { type: "idle" }
  | { type: "success"; message: string; saved: number }
  | { type: "error"; message: string };

function truncatePath(p: string, maxLen = 44): string {
  if (p.length <= maxLen) return p;
  return `…${p.slice(-maxLen + 1)}`;
}

export default function Home() {
  const [config, setConfig] = useState<{
    lolDirectory: string | null;
    detected: string | null;
    effectiveDirectory: string | null;
    available: boolean;
  } | null>(null);
  const [syncing, setSyncing] = useState(false);
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

  const handleSync = async () => {
    if (!window.lcu || syncing) return;
    setSyncing(true);
    setResult({ type: "idle" });
    setFolderError(null);
    try {
      const r = await window.lcu.runSync();
      if (r.success) {
        setResult({
          type: "success",
          message: r.message,
          saved: r.savedCount ?? 0,
        });
      } else {
        setResult({ type: "error", message: r.message });
      }
    } catch (e) {
      setResult({
        type: "error",
        message: e instanceof Error ? e.message : "Sync failed",
      });
    } finally {
      setSyncing(false);
      refreshConfig();
    }
  };

  const path = config?.effectiveDirectory ?? null;
  const canSync = path && config?.available && !syncing;

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
        onClick={handleSync}
        disabled={!canSync}
      >
        {syncing ? (
          <>
            <Icons.Loader className="size-4 animate-spin" />
            Syncing…
          </>
        ) : (
          "Sync now"
        )}
      </Button>

      {result.type === "success" && (
        <Alert className="mt-4 border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400">
          <AlertTitle>{result.message}</AlertTitle>
          {result.saved > 0 && (
            <AlertDescription>
              {result.saved} match{result.saved === 1 ? "" : "es"} synced.
            </AlertDescription>
          )}
        </Alert>
      )}
      {result.type === "error" && (
        <Alert variant="destructive" className="mt-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
      )}

      {/* Help button: bottom-right, black with white Riot icon */}
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
                  you’re logged in, tap “Sync now”. New custom games will be
                  sent to Rift Rank.
                </p>
                <p>
                  The status badge shows whether the client is running. Sync
                  only works when the client is open and you’re logged in.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </main>
  );
}
