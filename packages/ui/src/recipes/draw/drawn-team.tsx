"use client";

import { useTranslations } from "next-intl";
import { RankTag } from "../rank-tag";
import type { DrawnTeamView } from "./draw-view";
import { DrawnPlayerRow } from "./drawn-player-row";

interface DrawnTeamProps {
  /** Which of the two teams; it names the heading. */
  team: "a" | "b";
  view: DrawnTeamView;
}

/** One drawn team: its name and average rank, then its five players by role. */
export function DrawnTeam({ team, view }: DrawnTeamProps) {
  const t = useTranslations("draw");

  return (
    <section>
      <div className="flex items-baseline justify-between pb-3">
        <h2 className="text-2xl font-semibold uppercase leading-none tracking-[-0.03em] sm:text-3xl">
          {team === "a" ? t("teamA") : t("teamB")}
        </h2>
        <RankTag tier={view.avgRankTier} size="lg">
          {t("avgSolo")} {view.avgRankLabel}
        </RankTag>
      </div>
      <ul className="divide-y border-t">
        {view.players.map((player) => (
          <DrawnPlayerRow key={player.key} player={player} />
        ))}
      </ul>
    </section>
  );
}
