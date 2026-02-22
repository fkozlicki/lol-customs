import { ChampionImage } from "@/components/game-assets/champion-image";
import type { MatchParticipant } from "./match-history-list";

interface MVPPlayerProps {
  championId: number | null | undefined;
  participant: MatchParticipant | null | undefined;
}

export function MVPPlayer({ championId, participant }: MVPPlayerProps) {
  if (!participant || championId == null) return null;

  return (
    <div className="flex flex-col items-center">
      <ChampionImage
        championId={championId}
        width={48}
        height={48}
        className="rounded-full shrink-0 object-cover"
      />

      <span className="text-sm">{participant.players.game_name}</span>

      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500 text-white">
        MVP
      </span>
    </div>
  );
}
