import { cn } from "../../utils/cn";

/** How far a player is towards qualifying: matches played of those needed, as pips. */
export function QualifyingProgress({
  matches,
  of,
}: {
  matches: number;
  of: number;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="num text-[11px] text-muted-foreground">
        {matches}/{of}
      </span>
      <div className="flex gap-0.5">
        {Array.from({ length: of }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1 w-1.5",
              i < matches ? "bg-foreground" : "bg-border",
            )}
          />
        ))}
      </div>
    </div>
  );
}
