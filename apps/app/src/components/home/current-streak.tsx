import { cn } from "@v1/ui/cn";
import { Icons } from "@v1/ui/icons";

function formatCurrentStreak(
  winStreak: number | null,
  loseStreak: number | null,
): string {
  const w = winStreak ?? 0;
  const l = loseStreak ?? 0;
  if (w > 0) return `${w}`;
  if (l > 0) return `${l}`;
  return "0";
}

export default function CurrentStreak({
  winStreak,
  loseStreak,
}: {
  winStreak: number | null;
  loseStreak: number | null;
}) {
  const w = winStreak ?? 0;
  const l = loseStreak ?? 0;
  const hasStreak = w > 0 || l > 0;
  const isWinning = w > 0;
  return (
    <span className="flex items-center justify-end gap-1 tabular-nums">
      {hasStreak && (
        <Icons.Flame
          className={cn(
            "size-3.5 shrink-0",
            isWinning
              ? "text-amber-500 dark:text-amber-400"
              : "text-blue-500 dark:text-blue-400",
          )}
        />
      )}
      {formatCurrentStreak(winStreak, loseStreak)}
    </span>
  );
}
