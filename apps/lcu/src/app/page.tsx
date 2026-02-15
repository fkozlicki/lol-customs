"use client";

import { Alert, AlertDescription, AlertTitle } from "@v1/ui/alert";
import { Button } from "@v1/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@v1/ui/card";
import { Icons } from "@v1/ui/icons";
import { useCallback, useEffect, useState } from "react";

declare global {
  interface Window {
    lcu?: {
      getConfig: () => Promise<{
        lolDirectory: string | null;
        detected: string | null;
        effectiveDirectory: string | null;
        available: boolean;
      }>;
      openFolderDialog: () => Promise<
        { success: true; path: string } | { success: false; error: string }
      >;
      useDetected: () => Promise<
        { success: true; path: string } | { success: false; error: string }
      >;
      getClientStatus: () => Promise<{
        available: boolean;
        lolDirectory: string | null;
        detected: string | null;
        effectiveDirectory: string | null;
      }>;
      runSync: () => Promise<{
        success: boolean;
        message: string;
        savedCount?: number;
        skippedCount?: number;
      }>;
    };
  }
}

type ResultState =
  | { type: "idle" }
  | { type: "success"; message: string; saved: number; skipped: number }
  | { type: "error"; message: string };

function truncatePath(p: string, maxLen = 50): string {
  if (p.length <= maxLen) return p;
  return "…" + p.slice(-maxLen + 1);
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
  const [folderActionError, setFolderActionError] = useState<string | null>(
    null,
  );

  const refreshConfig = useCallback(() => {
    if (typeof window === "undefined" || !window.lcu) return;
    setFolderActionError(null);
    window.lcu.getConfig().then(setConfig);
  }, []);

  useEffect(() => {
    refreshConfig();
  }, [refreshConfig]);

  const handleChooseFolder = async () => {
    if (!window.lcu) return;
    setFolderActionError(null);
    const r = await window.lcu.openFolderDialog();
    if (r.success) {
      refreshConfig();
    } else {
      setFolderActionError(r.error);
    }
  };

  const handleUseDetected = async () => {
    if (!window.lcu) return;
    setFolderActionError(null);
    const r = await window.lcu.useDetected();
    if (r.success) {
      refreshConfig();
    } else {
      setFolderActionError(r.error);
    }
  };

  const handleSync = async () => {
    if (!window.lcu || syncing) return;
    setSyncing(true);
    setResult({ type: "idle" });
    setFolderActionError(null);
    try {
      const r = await window.lcu.runSync();
      if (r.success) {
        setResult({
          type: "success",
          message: r.message,
          saved: r.savedCount ?? 0,
          skipped: r.skippedCount ?? 0,
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

  const effectivePath = config?.effectiveDirectory ?? null;
  const canSync = effectivePath && config?.available && !syncing;

  return (
    <main className="flex min-h-screen flex-col p-6">
      <h1 className="text-xl font-semibold">Custom Ladder LCU</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Sync custom game matches from the League client to your database.
      </p>

      <Card className="mt-5">
        <CardHeader>
          <CardTitle>League of Legends folder</CardTitle>
          <CardDescription>
            Folder that contains the game client (and lockfile when running).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {config === null ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <>
              <p className="font-mono text-xs text-muted-foreground">
                {effectivePath
                  ? truncatePath(effectivePath)
                  : "Not set — choose a folder or use Auto-detect"}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleChooseFolder}
                >
                  Choose folder
                </Button>
                <Button variant="outline" size="sm" onClick={handleUseDetected}>
                  Auto-detect
                </Button>
              </div>
              {folderActionError && (
                <Alert variant="destructive">
                  <AlertTitle>Folder error</AlertTitle>
                  <AlertDescription>{folderActionError}</AlertDescription>
                </Alert>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <div className="mt-3">
        {config !== null && (
          <>
            {config.available ? (
              <p className="text-sm text-green-600 dark:text-green-400">
                League client detected. You can sync.
              </p>
            ) : effectivePath ? (
              <p className="text-sm text-destructive">
                League client not running. Start League and log in, then try
                again.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Set the League folder above, then start the client to sync.
              </p>
            )}
          </>
        )}
      </div>

      <Button className="mt-4" onClick={handleSync} disabled={!canSync}>
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
          <AlertDescription>
            Saved: {result.saved}, skipped: {result.skipped}
          </AlertDescription>
        </Alert>
      )}
      {result.type === "error" && (
        <Alert variant="destructive" className="mt-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
      )}
    </main>
  );
}
