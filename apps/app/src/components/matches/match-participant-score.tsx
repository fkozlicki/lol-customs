import { cn } from "@v1/ui/cn";
import type { MatchParticipant } from "./match-history-list";

interface MatchParticipantScoreProps {
  p: MatchParticipant;
  scores: number[];
}

export default function MatchParticipantScore({
  p,
  scores,
}: MatchParticipantScoreProps) {
  const place =
    p.op_score != null
      ? 1 + scores.filter((s) => s > p.op_score!).length
      : null;
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
      {p.op_score != null ? (
        <span className="text-xs font-semibold">{p.op_score}</span>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      )}
      {p.is_mvp && (
        <span
          className={cn(
            "text-[10px] font-semibold px-2 py-0.5 rounded-full",
            "bg-amber-500 text-white",
          )}
        >
          MVP
        </span>
      )}
      {p.is_ace && (
        <span
          className={cn(
            "text-[10px] font-semibold px-2 py-0.5 rounded-full",
            "bg-indigo-600/70 text-white",
          )}
        >
          ACE
        </span>
      )}
      {!p.is_mvp && !p.is_ace && placeText && (
        <span className="text-[10px] font-semibold px-1.5 py-0 rounded-full bg-slate-400 dark:bg-slate-500 text-white">
          {placeText}
        </span>
      )}
    </div>
  );
}
