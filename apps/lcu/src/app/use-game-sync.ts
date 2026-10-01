"use client";

import { GENERATED_PATCH } from "@v1/game-assets/champions";
import { latestPatch } from "@v1/game-assets/patch";
import { useCallback, useEffect, useState } from "react";
import type { GameForUi } from "@/electron-api";
import type { SaveResult } from "./games";

type LcuConfig = Awaited<ReturnType<NonNullable<Window["lcu"]>["getConfig"]>>;

/**
 * The page's state, over the Electron bridge: the League folder, the custom games the client
 * returns, which are ticked, and what the last fetch or save did.
 */
export function useGameSync() {
  const [config, setConfig] = useState<LcuConfig | null>(null);
  const [games, setGames] = useState<GameForUi[] | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<SaveResult>({ type: "idle" });
  const [folderError, setFolderError] = useState<string | null>(null);
  const [patch, setPatch] = useState(GENERATED_PATCH);

  // Never rejects: when Data Dragon can't be reached, it answers with the patch above.
  useEffect(() => {
    latestPatch().then(setPatch);
  }, []);

  const refreshConfig = useCallback(() => {
    if (typeof window === "undefined" || !window.lcu) return;
    setFolderError(null);
    window.lcu.getConfig().then(setConfig);
  }, []);

  useEffect(() => {
    refreshConfig();
  }, [refreshConfig]);

  const chooseFolder = async () => {
    if (!window.lcu) return;
    setFolderError(null);
    const r = await window.lcu.openFolderDialog();
    if (r.success) {
      refreshConfig();
    } else if (r.error !== "No folder selected") {
      setFolderError(r.error);
    }
  };

  /** A refresh after saving keeps the result on screen; a fresh fetch clears it and the ticks. */
  const fetchGames = async (isRefresh = false) => {
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

  const toggle = (game: GameForUi) => {
    if (game.isSaved) return;
    const id = game.match.gameId;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllUnsaved = () => {
    if (!games) return;
    setSelectedIds(
      new Set(games.filter((g) => !g.isSaved).map((g) => g.match.gameId)),
    );
  };

  const saveSelected = async () => {
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
        void fetchGames(true);
      } else {
        setResult({ type: "error", message: r.message, errors: r.errors });
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
  const ready = Boolean(path && config?.available);

  return {
    config,
    path,
    games,
    selectedIds,
    patch,
    result,
    folderError,
    fetching,
    saving,
    canFetch: ready && !fetching,
    canSave: ready && !saving && selectedIds.size > 0 && games != null,
    chooseFolder,
    fetchGames,
    toggle,
    selectAllUnsaved,
    saveSelected,
  };
}
