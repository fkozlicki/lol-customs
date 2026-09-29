"use client";

import { formatDistanceToNowStrict } from "date-fns";
import { enUS, pl } from "date-fns/locale";
import { cn } from "../../utils/cn";
import { useRecipesI18n, useRecipesLocale } from "../i18n/i18n";
import type { MatchCardView } from "./match-view";
import { RatingChange } from "./rating-change";

/**
 * The left column of a card: how long the match ran and how long ago. On a profile it also carries
 * the owner's result and rating change; the card is neutral without them.
 */
export function MatchMetadata({ match }: { match: MatchCardView }) {
  const t = useRecipesI18n("match");
  const locale = useRecipesLocale();
  const { player } = match;

  return (
    <div className="flex w-20 shrink-0 flex-col gap-1 sm:w-24">
      {player && (
        <>
          <span
            className={cn("label-caps", player.win ? "text-win" : "text-loss")}
          >
            {player.win ? t("victory") : t("defeat")}
          </span>
          <RatingChange
            value={player.ratingChange}
            className="text-2xl leading-none"
          />
        </>
      )}
      <span className="num text-xs text-muted-foreground">
        {match.duration}
      </span>
      <span className="text-xs text-muted-foreground">
        {formatDistanceToNowStrict(match.createdAt, {
          addSuffix: true,
          locale: locale === "pl" ? pl : enUS,
        })}
      </span>
    </div>
  );
}
