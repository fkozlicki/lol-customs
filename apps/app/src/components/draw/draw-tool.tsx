"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import {
  buildRandomTeams,
  type RandomTeamsResult,
  ROSTER_SIZE,
} from "@v1/domain/shuffle";
import { DrawBoard } from "@v1/ui/recipes/draw/draw-board";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { usePlayerPicker } from "@/components/player-picker/use-player-picker";
import { useTRPC } from "@/trpc/react";
import { toDrawnTeamView } from "./draw-view";

/** The draw: a roster of ten built from the ladder or by Riot ID, split into two teams at random. */
export function DrawTool() {
  const t = useTranslations("dashboard.pages.shuffle");
  const trpc = useTRPC();
  const { data: ladder } = useSuspenseQuery(trpc.players.all.queryOptions());
  const [teams, setTeams] = useState<RandomTeamsResult | null>(null);
  const roster = usePlayerPicker({
    ladder,
    size: ROSTER_SIZE,
    duplicateMessage: t("toastDuplicate"),
    invalidRiotIdMessage: t("toastInvalidRiot"),
    // A new roster makes the last draw stale.
    onChange: () => setTeams(null),
  });

  return (
    <DrawBoard
      teams={
        teams
          ? { a: toDrawnTeamView(teams.teamA), b: toDrawnTeamView(teams.teamB) }
          : null
      }
      roster={roster.views.picked}
      size={ROSTER_SIZE}
      candidates={roster.views.candidates}
      search={roster.search}
      onSearchChange={roster.setSearch}
      riotId={roster.riotId}
      onRiotIdChange={roster.setRiotId}
      onAdd={roster.add}
      onAddRiotId={roster.addByRiotId}
      onRemove={roster.remove}
      onClear={roster.clear}
      onDraw={() => setTeams(buildRandomTeams(roster.picked))}
    />
  );
}
