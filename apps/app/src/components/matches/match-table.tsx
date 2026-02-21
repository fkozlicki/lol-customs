import type { Json } from "@v1/supabase/types";
import { cn } from "@v1/ui/cn";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@v1/ui/table";
import type { ChampionMap, MatchParticipant } from "./match-history-list";
import { MatchRow } from "./match-row";

export interface RawParticipant {
  stats: {
    item0: number;
    item1: number;
    item2: number;
    item3: number;
    item4: number;
    item5: number;
    item6: number;
    perk0: number;
    perk1: number;
    perk2: number;
    perk3: number;
    perk4: number;
    perk5: number;
    perkPrimaryStyle?: number;
  };
  participantId: number;
  spell1Id: number;
  spell2Id: number;
}

export interface RawJson {
  participants: RawParticipant[];
}

export default function TeamTable({
  team,
  championMap,
  patch,
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
  championMap: ChampionMap;
  patch: string;
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
        <col className="w-[68px]" />
        <col className="w-[98px]" />
        <col className="w-[100px]" />
        <col className="w-[48px]" />
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
          <MatchRow
            key={p.puuid}
            p={p}
            championMap={championMap}
            highestDamageDealt={highestDamageDealt}
            highestDamageTaken={highestDamageTaken}
            totalKills={totalKills}
            duration={duration}
            rawParticipants={rawParticipants}
            scores={scores}
            isVictorious={isVictorious}
            patch={patch}
          />
        ))}
      </TableBody>
    </Table>
  );
}
