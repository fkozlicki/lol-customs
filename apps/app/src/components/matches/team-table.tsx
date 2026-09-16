"use client";

import type { Json } from "@v1/supabase/types";
import { cn } from "@v1/ui/cn";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@v1/ui/table";
import { useScopedI18n } from "@/locales/client";
import type { MatchParticipant, RawJson } from "./match-history-list";
import { TeamRow } from "./team-row";

export default function TeamTable({
  team,
  isVictorious,
  side,
  highestDamageDealt,
  highestDamageTaken,
  totalKills,
  duration,
  rawJson,
  scores,
}: {
  team: MatchParticipant[];
  isVictorious: boolean;
  side: "blue" | "red";
  highestDamageDealt: number;
  highestDamageTaken: number;
  totalKills: number;
  duration: number;
  rawJson: Json;
  scores: number[];
}) {
  const t = useScopedI18n("dashboard.pages.matchHistory");
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
        <TableRow className="hover:bg-transparent">
          <TableHead>
            <span
              className={cn(
                "label-caps",
                isVictorious ? "text-win" : "text-loss",
              )}
            >
              {isVictorious ? t("victory") : t("defeat")}
            </span>{" "}
            <span className="label-caps">· {side}</span>
          </TableHead>
          <TableHead className="label-caps text-center">
            {t("opScore")}
          </TableHead>
          <TableHead className="label-caps text-center">{t("kda")}</TableHead>
          <TableHead className="label-caps text-center">
            {t("damage")}
          </TableHead>
          <TableHead className="label-caps text-center">{t("wards")}</TableHead>
          <TableHead className="label-caps text-center">{t("cs")}</TableHead>
          <TableHead className="label-caps text-center">{t("items")}</TableHead>
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
