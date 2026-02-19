import { Icons } from "@v1/ui/icons";

export function BestStreak({ value }: { value: number | null }) {
  const hasBest = value != null && value > 0;
  return (
    <span className="text-muted-foreground flex items-center gap-1 tabular-nums text-[11px]">
      {hasBest && (
        <Icons.Flame className="size-2.5 text-amber-500/70 dark:text-amber-400/70 shrink-0" />
      )}
      {value != null ? String(value) : "—"}
    </span>
  );
}
