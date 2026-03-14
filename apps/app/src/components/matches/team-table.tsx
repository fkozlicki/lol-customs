import type { Json } from "@v1/supabase/types";
import { cn } from "@v1/ui/cn";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@v1/ui/table";
import type { MatchParticipant, RawJson } from "./match-history-list";
import { TeamRow } from "./team-row";

export default function TeamTable({
  team,
  isVictorious,
  teamName,
  highestDamageDealt,
  highestDamageTaken,
  totalKills,
  duration,
  rawJson,
  scores,
}: {
  team: MatchParticipant[];
  isVictorious: boolean;
  teamName: string;
  highestDamageDealt: number;
  highestDamageTaken: number;
  totalKills: number;
  duration: number;
  rawJson: Json;
  scores: number[];
}) {
  const result = isVictorious ? "Victory" : "Defeat";
  const rawParticipants = (rawJson as unknown as RawJson).participants;

  return (
    <Table className="w-full">
      <colgroup>
        <col className="w-auto" />
        <col className="w-[75px]" />
        <col className="w-[98px]" />
        <col className="w-[100px]" />
        <col className="w-[56px]" />
        <col className="w-[56px]" />
        <col className="w-[195px]" />
      </colgroup>
      <TableHeader>
        <TableRow>
          <TableHead
            className={cn(
              "text-xs font-semibold",
              isVictorious ? "text-blue-600" : "text-red-600",
            )}
          >
            {result} ({teamName})
          </TableHead>
          <TableHead className="text-center text-xs text-muted-foreground">
            OP Score
          </TableHead>
          <TableHead className="text-center text-xs text-muted-foreground">
            KDA
          </TableHead>
          <TableHead className="text-center text-xs text-muted-foreground">
            Damage
          </TableHead>
          <TableHead className="text-center text-xs text-muted-foreground">
            Wards
          </TableHead>
          <TableHead className="text-center text-xs text-muted-foreground">
            CS
          </TableHead>
          <TableHead className="text-center text-xs text-muted-foreground">
            Items
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {team.map((p) => (
          <TeamRow
            key={p.puuid}
            p={p}
            highestDamageDealt={highestDamageDealt}
            highestDamageTaken={highestDamageTaken}
            totalKills={totalKills}
            duration={duration}
            rawParticipants={rawParticipants}
            scores={scores}
            isVictorious={isVictorious}
          />
        ))}
      </TableBody>
    </Table>
  );
}
