import { ChampionImage } from "../game-assets/champion-image";
import type { ParticipantView } from "./match-view";

/** The MVP or ACE of a match: champion, badge, OP score and name. */
export function MatchHighlight({
  participant,
  label,
  tone,
}: {
  participant: ParticipantView | null;
  label: string;
  tone: "mvp" | "ace";
}) {
  if (!participant) return null;

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <ChampionImage
        championId={participant.championId}
        width={40}
        height={40}
        className="size-9 shrink-0 object-cover sm:size-10"
      />
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="label-caps whitespace-nowrap">
          <span className={tone === "mvp" ? "text-mvp" : "text-ace"}>
            {label}
          </span>
          {participant.opScore != null && (
            <span className="num"> • {participant.opScore.toFixed(1)}</span>
          )}
        </span>
        <span className="max-w-[7rem] truncate text-sm font-medium">
          {participant.name}
        </span>
      </div>
    </div>
  );
}
