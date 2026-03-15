import { ChampionImage } from "../game-assets/champion-image";
import { AverageRank } from "./average-rank";
import type { MatchParticipant, RawParticipant } from "./match-history-list";
import MatchParticipantItems from "./match-participant-items";
import MatchParticipantScore from "./match-participant-score";

interface PlayerMetadataProps {
  participant: MatchParticipant;
  rawData: RawParticipant | undefined;
  scores: number[];
  totalKills: number;
  participants: MatchParticipant[];
  isVictorious: boolean;
}

export function PlayerMetadata({
  participant,
  rawData,
  scores,
  totalKills,
  participants,
  isVictorious,
}: PlayerMetadataProps) {
  const kdaRatio =
    ((participant.kills ?? 0) + (participant.assists ?? 0)) /
    (participant.deaths ?? 0);

  const slash = () => (
    <span className="text-lg font-medium text-muted-foreground">/</span>
  );

  const killParticipation = Math.round(
    (((participant.kills ?? 0) + (participant.assists ?? 0)) / totalKills) *
      100,
  );
  const cs =
    (participant.total_minions_killed ?? 0) +
    (participant.neutral_minions_killed ?? 0);

  return (
    <div className="flex-1  grid place-items-center">
      <div className="space-y-2">
        <div className="flex">
          <div className="flex items-center gap-2 border-r pr-4 mr-4">
            <ChampionImage
              championId={participant.champion_id}
              width={48}
              height={48}
              className="rounded-full shrink-0 object-cover"
            />
            <div className="flex flex-col gap-0.5">
              {/* kda */}
              <span className="font-bold">
                {participant.kills ?? 0} {slash()}{" "}
                <span className="text-red-500">{participant.deaths ?? 0}</span>{" "}
                {slash()} {participant.assists ?? 0}
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                {kdaRatio.toFixed(2)}:1 KDA
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground font-medium">
              CS {cs}
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              P/KILL {killParticipation}%
            </span>
            <AverageRank participants={participants} hideLabel />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <MatchParticipantItems
            rawData={rawData}
            isVictorious={isVictorious}
          />
          <MatchParticipantScore p={participant} scores={scores} hideScore />
        </div>
      </div>
    </div>
  );
}
