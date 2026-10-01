"use client";

import { parseRiotId, riotIdKey } from "@v1/domain/riot-id";
import type { RosterPlayer } from "@v1/domain/shuffle";
import { toast } from "@v1/ui/sonner";
import { useMemo, useState } from "react";
import {
  type LadderPlayer,
  ladderCandidates,
  toPickablePlayerView,
  withLadderRank,
} from "./picker-view";

interface PlayerPickerOptions {
  ladder: LadderPlayer[];
  /** How many can be picked. */
  size: number;
  initial?: RosterPlayer[];
  /** Toasted when a pick is already in; the words are the caller's. */
  duplicateMessage: string;
  /** Toasted when a typed Riot ID is not one. */
  invalidRiotIdMessage: string;
  /** Called with every change to the picked players, e.g. to drop a draw made from the old ones. */
  onChange?: (picked: RosterPlayer[]) => void;
}

/**
 * Picking players for a roster or a pool: from the ladder by name, or by Riot ID, up to a size, each
 * once. What the recipes need comes back as views and handlers.
 */
export function usePlayerPicker({
  ladder,
  size,
  initial = [],
  duplicateMessage,
  invalidRiotIdMessage,
  onChange,
}: PlayerPickerOptions) {
  const [picked, setPicked] = useState<RosterPlayer[]>(initial);
  const [search, setSearch] = useState("");
  const [riotId, setRiotId] = useState("");

  const candidates = useMemo(
    () => ladderCandidates(ladder, { picked, search }),
    [ladder, picked, search],
  );

  function change(next: RosterPlayer[]) {
    setPicked(next);
    onChange?.(next);
  }

  function add(player: RosterPlayer): boolean {
    if (picked.some((entry) => riotIdKey(entry) === riotIdKey(player))) {
      toast.error(duplicateMessage);
      return false;
    }
    if (picked.length >= size) return false;
    change([...picked, player]);
    return true;
  }

  return {
    picked,
    full: picked.length >= size,
    views: {
      picked: picked.map(toPickablePlayerView),
      candidates: candidates.map(toPickablePlayerView),
    },
    search,
    setSearch,
    riotId,
    setRiotId,
    add: (key: string) => {
      const player = candidates.find((entry) => riotIdKey(entry) === key);
      if (player) add(player);
    },
    addByRiotId: () => {
      const parsed = parseRiotId(riotId);
      if (!parsed) {
        toast.error(invalidRiotIdMessage);
        return;
      }
      if (add(withLadderRank(parsed, ladder))) setRiotId("");
    },
    remove: (key: string) =>
      change(picked.filter((entry) => riotIdKey(entry) !== key)),
    clear: () => change([]),
  };
}
