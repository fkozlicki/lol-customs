import { cn } from "@v1/ui/cn";

/** A match's rating change on the selected track: +18 / −14, or a dash when unknown. */
export function RatingChange({
  value,
  className,
}: {
  value: number | null | undefined;
  className?: string;
}) {
  if (value == null) {
    return (
      <span className={cn("num text-muted-foreground", className)}>—</span>
    );
  }

  return (
    <span
      className={cn(
        "num font-semibold",
        value > 0 && "text-win",
        value < 0 && "text-loss",
        value === 0 && "text-muted-foreground",
        className,
      )}
    >
      {value > 0 ? "+" : value < 0 ? "−" : "±"}
      {Math.abs(value)}
    </span>
  );
}
