import { cn } from "@v1/ui/cn";

/** Current streak as W3 / L2 in the win or loss colour; a dash when there is none. */
export default function CurrentStreak({
  winStreak,
  loseStreak,
}: {
  winStreak: number | null;
  loseStreak: number | null;
}) {
  const wins = winStreak ?? 0;
  const losses = loseStreak ?? 0;

  if (wins === 0 && losses === 0) {
    return <span className="num text-muted-foreground">—</span>;
  }

  return (
    <span className={cn("num", wins > 0 ? "text-win" : "text-loss")}>
      {wins > 0 ? `W${wins}` : `L${losses}`}
    </span>
  );
}
