import { Badge } from "@v1/ui/badge";
import { cn } from "@v1/ui/cn";

export default function RankBadge({
  rank,
  labels,
}: {
  rank: number;
  labels: { rank1st: string; rank2nd: string; rank3rd: string };
}) {
  if (rank > 3) return <span className="tabular-nums">{rank}</span>;
  const styles = [
    "bg-amber-500/15 text-amber-700 dark:text-amber-400 dark:bg-amber-500/20 border-amber-500/30",
    "bg-zinc-400/15 text-zinc-600 dark:text-zinc-400 dark:bg-zinc-400/20 border-zinc-400/30",
    "bg-amber-700/20 text-amber-800 dark:text-amber-600 dark:bg-amber-600/25 border-amber-700/40",
  ];
  const label = [labels.rank1st, labels.rank2nd, labels.rank3rd][rank - 1];
  return (
    <Badge
      variant="outline"
      className={cn(
        "tabular-nums font-semibold shrink-0 border",
        styles[rank - 1],
      )}
    >
      {label}
    </Badge>
  );
}
