"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { parseRiotId, riotIdKey } from "@v1/domain/riot-id";
import {
  buildRandomTeams,
  type RandomTeamsResult,
  ROSTER_SIZE,
  type RosterPlayer,
} from "@v1/domain/shuffle";
import { DrawBoard } from "@v1/ui/recipes/draw/draw-board";
import { toast } from "@v1/ui/sonner";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useTRPC } from "@/trpc/react";
import {
  ladderCandidates,
  toDrawnTeamView,
  toDrawPlayerView,
  toRosterPlayer,
} from "./draw-view";

/** The draw: a roster of ten built from the ladder or by Riot ID, split into two teams at random. */
export function DrawTool() {
  const t = useTranslations("dashboard.pages.shuffle");
  const trpc = useTRPC();
  const { data: ladder } = useSuspenseQuery(trpc.players.all.queryOptions());

  const [search, setSearch] = useState("");
  const [riotId, setRiotId] = useState("");
  const [roster, setRoster] = useState<RosterPlayer[]>([]);
  const [teams, setTeams] = useState<RandomTeamsResult | null>(null);

  const candidates = useMemo(
    () => ladderCandidates(ladder, { roster, search }),
    [ladder, roster, search],
  );

  function changeRoster(next: RosterPlayer[]) {
    setRoster(next);
    setTeams(null);
  }

  function add(player: RosterPlayer): boolean {
    if (roster.some((entry) => riotIdKey(entry) === riotIdKey(player))) {
      toast.error(t("toastDuplicate"));
      return false;
    }
    if (roster.length >= ROSTER_SIZE) return false;
    changeRoster([...roster, player]);
    return true;
  }

  function addByRiotId() {
    const parsed = parseRiotId(riotId);
    if (!parsed) {
      toast.error(t("toastInvalidRiot"));
      return;
    }
    // A known player keeps their rank; a stranger joins unranked.
    const known = ladder
      .map(toRosterPlayer)
      .find((player) => player && riotIdKey(player) === riotIdKey(parsed));
    const added = add({
      ...parsed,
      rankTier: known?.rankTier ?? null,
      rankDivision: known?.rankDivision ?? null,
    });
    if (added) setRiotId("");
  }

  return (
    <DrawBoard
      teams={
        teams
          ? { a: toDrawnTeamView(teams.teamA), b: toDrawnTeamView(teams.teamB) }
          : null
      }
      roster={roster.map(toDrawPlayerView)}
      size={ROSTER_SIZE}
      candidates={candidates.map(toDrawPlayerView)}
      search={search}
      onSearchChange={setSearch}
      riotId={riotId}
      onRiotIdChange={setRiotId}
      onAdd={(key) => {
        const player = candidates.find((entry) => riotIdKey(entry) === key);
        if (player) add(player);
      }}
      onAddRiotId={addByRiotId}
      onRemove={(key) =>
        changeRoster(roster.filter((entry) => riotIdKey(entry) !== key))
      }
      onClear={() => changeRoster([])}
      onDraw={() => setTeams(buildRandomTeams(roster))}
    />
  );
}
