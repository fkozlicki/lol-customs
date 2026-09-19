"use client";

import { cn } from "@v1/ui/cn";
import { formatDistanceToNowStrict } from "date-fns";
import { enUS, pl } from "date-fns/locale";
import { useCurrentLocale, useScopedI18n } from "@/locales/client";
import type { Match, MatchParticipant } from "./match-history-list";
import { RatingChange } from "./rating-change";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

interface MatchMetadataProps {
  match: Match;
  /** The profile owner's participation; the card is neutral without it. */
  participant?: MatchParticipant;
}

export function MatchMetadata({ match, participant }: MatchMetadataProps) {
  const t = useScopedI18n("dashboard.pages.matchHistory");
  const locale = useCurrentLocale();

  return (
    <div className="flex w-20 shrink-0 flex-col gap-1 sm:w-24">
      {participant && (
        <>
          <span
            className={cn(
              "label-caps",
              participant.win ? "text-win" : "text-loss",
            )}
          >
            {participant.win ? t("victory") : t("defeat")}
          </span>
          <RatingChange
            value={participant.rating_change}
            className="text-2xl leading-none"
          />
        </>
      )}
      <span className="num text-xs text-muted-foreground">
        {formatDuration(match.duration)}
      </span>
      <span className="text-xs text-muted-foreground">
        {formatDistanceToNowStrict(match.game_creation, {
          addSuffix: true,
          locale: locale === "pl" ? pl : enUS,
        })}
      </span>
    </div>
  );
}
