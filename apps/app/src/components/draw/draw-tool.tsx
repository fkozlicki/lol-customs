"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import {
  buildRandomTeams,
  type RandomTeamsResult,
  ROSTER_SIZE,
} from "@v1/domain/shuffle";
import { Button } from "@v1/ui/button";
import { Icons } from "@v1/ui/icons";
import { DrawnTeam } from "@v1/ui/recipes/draw/drawn-team";
import { PickerCount } from "@v1/ui/recipes/player-picker/picker-count";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { PlayerPoolPicker } from "@/components/player-picker/player-pool-picker";
import { usePlayerPicker } from "@/components/player-picker/use-player-picker";
import { useTRPC } from "@/trpc/react";
import { toDrawnTeamView } from "./draw-view";

/**
 * The draw: a roster of ten built from the ladder or by Riot ID, split into two teams at random —
 * sides, roles and captains included. The teams show on top; the roster and the ways to fill it below.
 */
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
    <div className="space-y-10">
      {teams && (
        <section className="grid gap-10 md:grid-cols-2 md:gap-16">
          <DrawnTeam team="a" view={toDrawnTeamView(teams.teamA)} />
          <DrawnTeam team="b" view={toDrawnTeamView(teams.teamB)} />
        </section>
      )}

      <div className="flex items-center justify-between gap-4">
        <PickerCount
          count={roster.picked.length}
          size={ROSTER_SIZE}
          clearLabel={t("clearRoster")}
          onClear={roster.clear}
        />
        <Button
          type="button"
          disabled={!roster.full}
          onClick={() => setTeams(buildRandomTeams(roster.picked))}
        >
          <Icons.Shuffle className="size-4" />
          {teams ? t("reroll") : t("generate")}
        </Button>
      </div>

      <PlayerPoolPicker
        picker={roster}
        words="dashboard.pages.shuffle.picker"
      />
    </div>
  );
}
