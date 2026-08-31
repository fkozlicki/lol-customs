"use client";

import { Progress } from "@v1/ui/progress";
import { useEffect, useMemo, useState } from "react";

export function AuctionCountdown({
  deadline,
  serverNow,
  durationSeconds,
  compact = false,
}: {
  deadline: string;
  serverNow: string;
  durationSeconds: number;
  compact?: boolean;
}) {
  // Server/client clock offset is captured once per snapshot. Using the raw
  // serverNow on every tick would cancel out the elapsed local time, pausing
  // the countdown, so we freeze the offset and subtract the growing local time.
  const clockOffset = useMemo(
    () => Date.parse(serverNow) - Date.now(),
    [serverNow],
  );

  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Date.parse(deadline) - (Date.now() + clockOffset)),
  );

  useEffect(() => {
    const update = () =>
      setRemaining(
        Math.max(0, Date.parse(deadline) - (Date.now() + clockOffset)),
      );
    update();
    const interval = window.setInterval(update, 100);
    return () => window.clearInterval(interval);
  }, [deadline, clockOffset]);

  const seconds = remaining / 1000;
  const percent = Math.min(100, (remaining / (durationSeconds * 1000)) * 100);

  if (compact) {
    return (
      <span className="font-mono tabular-nums">{seconds.toFixed(1)}s</span>
    );
  }

  return (
    <div className="w-full space-y-2" aria-live="polite">
      <div
        className={`font-mono text-5xl font-black tabular-nums tracking-tight sm:text-7xl ${seconds <= 5 ? "text-destructive" : "text-foreground"}`}
      >
        {seconds.toFixed(1)}
      </div>
      <Progress
        value={percent}
        className={`h-2.5 bg-black/10 dark:bg-white/10 ${seconds <= 5 ? "[&_[data-slot=progress-indicator]]:bg-destructive" : "[&_[data-slot=progress-indicator]]:bg-amber-500"}`}
      />
    </div>
  );
}
