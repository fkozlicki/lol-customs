import { ChampionImage } from "@/components/game-assets/champion-image";
import { RankCrest } from "@/components/game-assets/rank-crest";
import { SpellImage } from "@/components/game-assets/spell-image";
import type { MatchParticipant } from "./match-history-list";
import type { RawParticipant } from "./team-table";

interface MatchParticipantInfoProps {
  p: MatchParticipant;
  rawData: RawParticipant | undefined;
}

export default function MatchParticipantInfo({
  p,
  rawData,
}: MatchParticipantInfoProps) {
  return (
    <div className="flex items-center gap-1">
      <div className="relative">
        <ChampionImage
          championId={p.champion_id}
          width={32}
          height={32}
          className="rounded-full shrink-0"
        />
        <div className="absolute bottom-0 right-0 text-[10px] size-4 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-medium">
          {p.champ_level}
        </div>
      </div>
      <div className="flex flex-col gap-0.5">
        {rawData?.spell1Id != null && rawData.spell1Id !== 0 && (
          <SpellImage
            spellId={rawData.spell1Id}
            width={16}
            height={16}
            className="rounded-sm"
          />
        )}
        {rawData?.spell2Id != null && rawData.spell2Id !== 0 && (
          <SpellImage
            spellId={rawData.spell2Id}
            width={16}
            height={16}
            className="rounded-sm"
          />
        )}
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-muted-foreground text-xs max-w-[90px] truncate">
          {p.players.game_name}
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground capitalize">
          <RankCrest tier={p.rank_tier} width={14} height={14} className="shrink-0" />
          {p.rank_tier?.toLowerCase() ?? "Unranked"} {p.rank_division ?? ""}
        </span>
      </div>
    </div>
  );
}
