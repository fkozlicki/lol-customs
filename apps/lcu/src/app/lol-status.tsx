"use client";

import { cn } from "@v1/ui/cn";

interface LolStatusProps {
  hasFolder: boolean;
  isRunning: boolean;
  className?: string;
}

/** Shows only Running / Not running (no "No folder" — that’s implied by the button area). */
export function LolStatus({ hasFolder, isRunning, className }: LolStatusProps) {
  const running = hasFolder && isRunning;
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs",
        running
          ? "border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-400"
          : "border-muted bg-muted/50 text-muted-foreground",
        className,
      )}
    >
      <img
        src="/riot-icon.png"
        alt=""
        className={cn("size-4 object-contain", running ? "opacity-90" : "opacity-70")}
      />
      <span
        className={cn(
          "size-1.5 rounded-full",
          running ? "bg-green-600 dark:bg-green-400" : "bg-muted-foreground/60",
        )}
      />
      {running ? "Running" : "Not running"}
    </div>
  );
}
