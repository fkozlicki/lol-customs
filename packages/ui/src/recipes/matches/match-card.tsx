"use client";

import { cn } from "../../utils/cn";
import { useRecipesI18n } from "../i18n/i18n";
import { Icons } from "../icons";
import { MatchHighlights } from "./match-highlights";
import { MatchMetadata } from "./match-metadata";
import MatchTeam from "./match-team";
import type { MatchCardView } from "./match-view";
import { PlayerMetadata } from "./player-metadata";

interface MatchCardProps {
  match: MatchCardView;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export default function MatchCard({
  match,
  isExpanded,
  onToggleExpand,
}: MatchCardProps) {
  const t = useRecipesI18n("match");
  const { player } = match;
  const outcome = player ? (player.win ? "win" : "loss") : null;

  return (
    <div
      className={cn(
        "flex items-stretch border border-l-4 bg-card",
        outcome === "win" && "border-l-win bg-win/[0.1]",
        outcome === "loss" && "border-l-loss bg-loss/[0.1]",
        !outcome && "border-l-foreground/40",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-4 px-3 py-3 sm:gap-6 sm:px-4">
        <MatchMetadata match={match} />

        {player ? (
          <PlayerMetadata participant={player} />
        ) : (
          <MatchHighlights match={match} />
        )}

        <div className="hidden shrink-0 items-center gap-4 lg:flex">
          <MatchTeam team={match.blue} playerKey={player?.key} />
          <MatchTeam team={match.red} playerKey={player?.key} />
        </div>
      </div>

      <button
        type="button"
        onClick={onToggleExpand}
        aria-expanded={isExpanded}
        aria-label={t("expand")}
        className={cn(
          "flex w-9 shrink-0 items-end justify-center border-l pb-3 text-muted-foreground transition-colors hover:text-foreground",
          outcome === "win" && "hover:bg-win/[0.18]",
          outcome === "loss" && "hover:bg-loss/[0.18]",
          !outcome && "hover:bg-muted",
        )}
      >
        <Icons.ChevronDown
          className={cn(
            "size-4 transition-transform duration-200 ease-(--ease-derby)",
            isExpanded && "rotate-180",
          )}
        />
      </button>
    </div>
  );
}
