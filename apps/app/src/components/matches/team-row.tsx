import { cn } from "@v1/ui/cn";
import { TableCell, TableRow } from "@v1/ui/table";
import type { MatchParticipant, RawParticipant } from "./match-history-list";
import MatchParticipantCS from "./match-participant-cs";
import MatchParticipantDamage from "./match-participant-damage";
import MatchParticipantInfo from "./match-participant-info";
import MatchParticipantItems from "./match-participant-items";
import MatchParticipantKDA from "./match-participant-kda";
import MatchParticipantScore from "./match-participant-score";
import MatchParticipantWards from "./match-participant-wards";

interface TeamRowProps {
  p: MatchParticipant;
  highestDamageDealt: number;
  highestDamageTaken: number;
  totalKills: number;
  duration: number;
  rawParticipants: RawParticipant[];
  scores: number[];
  isVictorious: boolean;
}

export function TeamRow({
  p,
  highestDamageDealt,
  highestDamageTaken,
  totalKills,
  duration,
  rawParticipants,
  scores,
  isVictorious,
}: TeamRowProps) {
  const rawData = rawParticipants.find(
    (par) => par.participantId === p.participant_id,
  );

  return (
    <TableRow
      key={p.puuid}
      className={cn(
        "border-b last:border-b-0",
        isVictorious
          ? "bg-win/[0.06] hover:bg-win/[0.12]"
          : "bg-loss/[0.06] hover:bg-loss/[0.12]",
      )}
    >
      <TableCell className="p-1">
        <MatchParticipantInfo p={p} rawData={rawData} />
      </TableCell>
      <TableCell className="p-1">
        <MatchParticipantScore p={p} scores={scores} />
      </TableCell>
      <TableCell className="p-1">
        <MatchParticipantKDA p={p} totalKills={totalKills} />
      </TableCell>
      <TableCell className="p-1">
        <MatchParticipantDamage
          p={p}
          highestDamageDealt={highestDamageDealt}
          highestDamageTaken={highestDamageTaken}
        />
      </TableCell>
      <TableCell className="p-1 text-center">
        <MatchParticipantWards p={p} />
      </TableCell>
      <TableCell className="p-1 text-center">
        <MatchParticipantCS p={p} duration={duration} />
      </TableCell>
      <TableCell>
        <MatchParticipantItems rawData={rawData} />
      </TableCell>
    </TableRow>
  );
}
