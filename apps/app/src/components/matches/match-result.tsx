import { cn } from "@v1/ui/cn";

export function MatchResult({ blueWon }: { blueWon: boolean }) {
  return (
    <div
      className={cn(
        "rounded px-2 py-1 text-sm font-medium ",
        blueWon
          ? "bg-blue-500/20 text-blue-700 dark:text-blue-300"
          : "bg-red-500/20 text-red-700 dark:text-red-300",
      )}
    >
      {blueWon ? "Blue victory" : "Red victory"}
    </div>
  );
}
