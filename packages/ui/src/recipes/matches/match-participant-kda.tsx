"use client";

import { useRecipesI18n } from "../i18n/i18n";
import type { ParticipantView } from "./match-view";

/** Kills / deaths / assists, kill participation, and the ratio. */
export default function MatchParticipantKDA({
  participant,
}: {
  participant: ParticipantView;
}) {
  const t = useRecipesI18n("match");

  return (
    <div className="num flex flex-col items-center gap-0.5 text-xs">
      <span>
        {participant.kills}/{participant.deaths}/{participant.assists}{" "}
        <span className="text-muted-foreground">
          ({participant.killParticipation}%)
        </span>
      </span>
      <span className="text-muted-foreground">
        {participant.kdaRatio ?? t("perfect")}
      </span>
    </div>
  );
}
