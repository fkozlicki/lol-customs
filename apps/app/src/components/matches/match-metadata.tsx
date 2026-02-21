import { Separator } from "@v1/ui/separator";
import { formatDistanceToNowStrict } from "date-fns";
import type { Match } from "./match-history-list";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function matchTypeLabel(match: Match): string {
  if (match.game_mode) return match.game_mode;
  if (match.queue_id != null) return `Queue ${match.queue_id}`;
  return "Custom";
}

export function MatchMetadata({ match }: { match: Match }) {
  return (
    <div className="flex flex-col shrink-0 min-w-[100px] justify-between">
      <div className="flex flex-col gap-0.5">
        <span className="text-muted-foreground text-xs font-semibold">
          {matchTypeLabel(match)}
        </span>
        <span className="text-muted-foreground text-xs">
          {formatDistanceToNowStrict(match.game_creation, {
            addSuffix: true,
          })}
        </span>
      </div>
      <Separator className="my-1" />
      <div className="flex flex-col gap-0.5">
        <span className="font-medium text-sm">
          {formatDuration(match.duration)}
        </span>
        {match.patch && (
          <span className="text-muted-foreground text-xs">
            Patch {match.patch.split(".").slice(0, 2).join(".")}
          </span>
        )}
      </div>
    </div>
  );
}
