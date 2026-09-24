import { cn } from "@v1/ui/cn";

interface WinLossProps {
  wins: number | null;
  losses: number | null;
  className?: string;
}

/**
 * A win–loss record: the two numbers in their result colours, separated by an en dash.
 *
 * Written five times — on the podium, in a standings row, on a profile, per champion, and per rival —
 * with the dash muted in one of them and inherited in the other four. It is muted here: the dash is
 * punctuation, not a result. The size comes from the caller, because the record appears at four of
 * them.
 */
export function WinLoss({ wins, losses, className }: WinLossProps) {
  return (
    <span className={cn("num", className)}>
      <span className="text-win">{wins ?? 0}</span>
      <span className="text-muted-foreground">–</span>
      <span className="text-loss">{losses ?? 0}</span>
    </span>
  );
}
