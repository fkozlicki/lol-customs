import { TableCell, TableRow } from "../../components/table";
import { cn } from "../../utils/cn";
import MatchParticipantCS from "./match-participant-cs";
import MatchParticipantDamage from "./match-participant-damage";
import MatchParticipantInfo from "./match-participant-info";
import MatchParticipantItems from "./match-participant-items";
import MatchParticipantKDA from "./match-participant-kda";
import MatchParticipantScore from "./match-participant-score";
import MatchParticipantWards from "./match-participant-wards";
import type { ParticipantView } from "./match-view";

/** One scoreboard row, tinted with its side's result. */
export function TeamRow({ participant }: { participant: ParticipantView }) {
  return (
    <TableRow
      className={cn(
        "border-b last:border-b-0",
        participant.win
          ? "bg-win/[0.06] hover:bg-win/[0.12]"
          : "bg-loss/[0.06] hover:bg-loss/[0.12]",
      )}
    >
      <TableCell className="p-1">
        <MatchParticipantInfo participant={participant} />
      </TableCell>
      <TableCell className="p-1">
        <MatchParticipantScore participant={participant} />
      </TableCell>
      <TableCell className="p-1">
        <MatchParticipantKDA participant={participant} />
      </TableCell>
      <TableCell className="p-1">
        <MatchParticipantDamage participant={participant} />
      </TableCell>
      <TableCell className="p-1 text-center">
        <MatchParticipantWards participant={participant} />
      </TableCell>
      <TableCell className="p-1 text-center">
        <MatchParticipantCS participant={participant} />
      </TableCell>
      <TableCell>
        <MatchParticipantItems itemIds={participant.itemIds} />
      </TableCell>
    </TableRow>
  );
}
