import { cn } from "@v1/ui/cn";
import { TableCell, TableRow } from "@v1/ui/table";
import type { MatchParticipant } from "./match-history-list";
import MatchParticipantCS from "./match-participant-cs";
import MatchParticipantDamage from "./match-participant-damage";
import MatchParticipantInfo from "./match-participant-info";
import MatchParticipantItems from "./match-participant-items";
import MatchParticipantKDA from "./match-participant-kda";
import MatchParticipantScore from "./match-participant-score";
import MatchParticipantWards from "./match-participant-wards";
import type { RawParticipant } from "./team-table";

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
        "border-none",
        isVictorious
          ? "bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/50 dark:hover:bg-blue-800/50"
          : "bg-red-50 hover:bg-red-100 dark:bg-red-900/50 dark:hover:bg-red-800/50",
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
