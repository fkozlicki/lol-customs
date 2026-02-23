import { cn } from "@v1/ui/cn";
import type { MatchParticipant } from "./match-history-list";

interface MatchParticipantScoreProps {
  p: MatchParticipant;
  scores: number[];
  hideScore?: boolean;
}

export default function MatchParticipantScore({
  p,
  scores,
  hideScore = false,
}: MatchParticipantScoreProps) {
  const opScore = p.op_score;

  if (!opScore) {
    return null;
  }

  const place = 1 + scores.filter((s) => s > opScore).length;

  const placeText =
    place === 1
      ? "1st"
      : place === 2
        ? "2nd"
        : place === 3
          ? "3rd"
          : `${place}th`;

  return (
    <div className="flex items-center justify-center gap-1">
      {!hideScore && <span className="text-xs font-bold">{opScore}</span>}
      {p.is_mvp && (
        <span
          className={cn(
            "text-xs font-semibold px-2 py-0.5 rounded-full",
            "bg-amber-500 text-white",
          )}
        >
          MVP
        </span>
      )}
      {p.is_ace && (
        <span
          className={cn(
            "text-xs font-semibold px-2 py-0.5 rounded-full",
            "bg-indigo-600/70 text-white",
          )}
        >
          ACE
        </span>
      )}
      {!p.is_mvp && !p.is_ace && (
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-400 dark:bg-slate-500 text-white">
          {placeText}
        </span>
      )}
    </div>
  );
}
