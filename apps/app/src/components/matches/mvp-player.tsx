import Image from "next/image";
import type { MatchParticipant } from "./match-card";
import type { ChampionMap } from "./match-detail";

const DD_CDN = "https://ddragon.leagueoflegends.com/cdn";

interface MVPPlayerProps {
  champion: ChampionMap[string] | null | undefined;
  participant: MatchParticipant | null | undefined;
  patch: string;
}

export function MVPPlayer({ champion, participant, patch }: MVPPlayerProps) {
  if (!participant || !champion) return null;

  return (
    <div className="flex flex-col items-center">
      <Image
        src={`${DD_CDN}/${patch}/img/champion/${champion.imageFull}`}
        alt=""
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
