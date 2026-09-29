"use client";

import { cn } from "../../utils/cn";
import { useRecipesI18n } from "../i18n/i18n";

/** How an auction page is keeping up with the room: live over realtime, polling, or connecting. */
export function ConnectionBadge({
  state,
}: {
  state: "connecting" | "live" | "degraded";
}) {
  const t = useRecipesI18n("auctions.connection");

  return (
    <span className="flex items-center gap-1.5">
      <span
        className={cn(
          "size-1.5",
          state === "live" ? "bg-foreground" : "bg-muted-foreground",
          state === "connecting" && "animate-pulse",
        )}
      />
      <span className="label-caps">{t(state)}</span>
    </span>
  );
}
