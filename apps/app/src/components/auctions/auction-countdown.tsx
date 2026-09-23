"use client";

import { Progress } from "@v1/ui/progress";
import { useEffect, useMemo, useState } from "react";

export function AuctionCountdown({
  deadline,
  serverNow,
  durationSeconds,
}: {
  deadline: string;
  serverNow: string;
  durationSeconds: number;
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

  return (
    <div className="w-full space-y-2" aria-live="polite">
      <div
        className={`num text-5xl font-semibold sm:text-7xl ${seconds <= 5 ? "text-loss" : "text-foreground"}`}
      >
        {seconds.toFixed(1)}
      </div>
      <Progress
        value={percent}
        className={`h-1.5 bg-foreground/15 ${seconds <= 5 ? "[&_[data-slot=progress-indicator]]:bg-loss" : "[&_[data-slot=progress-indicator]]:bg-foreground"}`}
      />
    </div>
  );
}
