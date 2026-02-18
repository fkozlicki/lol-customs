import type { Json } from "@v1/supabase/types";
import { cn } from "@v1/ui/cn";
import { Progress } from "@v1/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@v1/ui/table";
import Image from "next/image";
import type { ChampionMap, MatchWithParticipants } from "./match-detail";

type Participant = MatchWithParticipants["participants"][number];

interface RawParticipant {
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

interface RawJson {
  participants: RawParticipant[];
}

const DD_CDN = "https://ddragon.leagueoflegends.com/cdn";

const RANK_CRESTS_BASE =
  "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/";

const SPELL_ID_TO_KEY: Record<number, string> = {
  1: "SummonerBoost",
  3: "SummonerExhaust",
  4: "SummonerFlash",
  6: "SummonerHaste",
  7: "SummonerHeal",
  11: "SummonerSmite",
  12: "SummonerTeleport",
  14: "SummonerDot",
  21: "SummonerBarrier",
  30: "SummonerPoroRecall",
  31: "SummonerPoroThrow",
  32: "SummonerSnowball",
  39: "SummonerSnowURFSnowball_Mark",
  54: "Summoner_UltBookPlaceholder",
  55: "Summoner_UltBookSmitePlaceholder",
};

function getSpellIconUrl(spellId: number, patch: string): string {
  const key = SPELL_ID_TO_KEY[spellId] ?? "SummonerFlash";
  return `${DD_CDN}/${patch}/img/spell/${key}.png`;
}

const RANK_TIERS = new Set([
  "iron",
  "bronze",
  "silver",
  "gold",
  "platinum",
  "emerald",
  "diamond",
  "master",
  "grandmaster",
  "challenger",
]);

function getRankIconUrl(rank_tier: string | null): string {
  if (!rank_tier?.trim()) return `${RANK_CRESTS_BASE}unranked.svg`;
  const tier = rank_tier.toLowerCase();
  return RANK_TIERS.has(tier)
    ? `${RANK_CRESTS_BASE}${tier}.svg`
    : `${RANK_CRESTS_BASE}unranked.svg`;
}

function playerDisplayName(p: Participant): string {
  const pl = p.players as {
    game_name: string | null;
    tag_line: string | null;
  } | null;
  if (!pl?.game_name) return "—";
  return pl.game_name;
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
  team: Participant[];
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
        {team.map((p) => {
          const ch =
            p.champion_id != null ? championMap[String(p.champion_id)] : null;
          const damageDealtPercentage =
            ((p.total_damage_dealt_to_champions ?? 0) / highestDamageDealt) *
            100;
          const damageTakenPercentage =
            ((p.total_damage_taken ?? 0) / highestDamageTaken) * 100;
          const killParticipation = Math.round(
            (((p.kills ?? 0) + (p.assists ?? 0)) / totalKills) * 100,
          );
          const kdaRatio =
            ((p.kills ?? 0) + (p.assists ?? 0)) / (p.deaths ?? 0);
          const rankIconUrl = getRankIconUrl(p.rank_tier);
          const csPerMin =
            (p.total_minions_killed ?? 0 + (p.neutral_minions_killed ?? 0)) /
            (duration / 60);
          const rawData = rawParticipants.find(
            (par) => par.participantId === p.participant_id,
          );
          // place - based on op score
          const place = p.op_score ? scores.indexOf(p.op_score) + 1 : null;
          const placeText =
            place === 1
              ? "1st"
              : place === 2
                ? "2nd"
                : place === 3
                  ? "3rd"
                  : `${place}th`;

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
                <div className="flex items-center gap-1">
                  {ch && (
                    <div className="relative">
                      <Image
                        src={`${DD_CDN}/${patch}/img/champion/${ch.imageFull}`}
                        alt=""
                        width={32}
                        height={32}
                        className="rounded-full shrink-0"
                      />
                      <div className="absolute bottom-0 right-0 text-[10px] size-4 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-medium">
                        {p.champ_level}
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col gap-0.5">
                    {rawData?.spell1Id != null && rawData.spell1Id !== 0 && (
                      <Image
                        src={getSpellIconUrl(rawData.spell1Id, patch)}
                        alt=""
                        width={16}
                        height={16}
                        className="rounded-sm"
                      />
                    )}
                    {rawData?.spell2Id != null && rawData.spell2Id !== 0 && (
                      <Image
                        src={getSpellIconUrl(rawData.spell2Id, patch)}
                        alt=""
                        width={16}
                        height={16}
                        className="rounded-sm"
                      />
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-muted-foreground text-xs max-w-[90px] truncate">
                      {playerDisplayName(p)}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground capitalize">
                      <Image
                        src={rankIconUrl}
                        alt=""
                        width={14}
                        height={14}
                        className="shrink-0"
                      />
                      {p.rank_tier?.toLowerCase() ?? "Unranked"}{" "}
                      {p.rank_division ?? ""}
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="p-1">
                <div className="flex items-center justify-center gap-1">
                  {p.op_score != null ? (
                    <span className="text-xs font-semibold">{p.op_score}</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                  {p.is_mvp && (
                    <span
                      className={cn(
                        "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                        "bg-amber-500 text-white",
                      )}
                    >
                      MVP
                    </span>
                  )}
                  {p.is_ace && (
                    <span
                      className={cn(
                        "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                        "bg-indigo-600/70 text-white",
                      )}
                    >
                      ACE
                    </span>
                  )}
                  {!p.is_mvp && !p.is_ace && placeText && (
                    <span className="text-[10px] font-semibold px-1.5 py-0 rounded-full bg-slate-400 dark:bg-slate-500 text-white">
                      {placeText}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="p-1">
                <div className="flex flex-col gap-0.5 items-center">
                  <span className="text-xs">
                    {p.kills ?? 0}/{p.deaths ?? 0}/{p.assists ?? 0} (
                    {killParticipation}%)
                  </span>
                  <span className="text-xs">{kdaRatio.toFixed(2)}</span>
                </div>
              </TableCell>
              <TableCell className="p-1">
                <div className="flex gap-1 justify-center">
                  <div>
                    <span className="text-xs text-muted-foreground">
                      {(
                        p.total_damage_dealt_to_champions ?? 0
                      ).toLocaleString()}
                    </span>
                    <Progress
                      className="w-10 [&>div]:bg-red-600 dark:[&>div]:bg-red-900 rounded-none h-1.5 bg-background"
                      value={damageDealtPercentage}
                    />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      {(p.total_damage_taken ?? 0).toLocaleString()}
                    </span>
                    <Progress
                      className="w-10 [&>div]:bg-gray-300 rounded-none h-1.5 bg-background dark:[&>div]:bg-gray-600"
                      value={damageTakenPercentage}
                    />
                  </div>
                </div>
              </TableCell>
              <TableCell className="p-1 text-center">
                <span className="text-xs">
                  {p.wards_placed ?? 0} / {p.wards_killed ?? 0}
                </span>
              </TableCell>
              <TableCell className="p-1 text-center">
                <div className="flex flex-col gap-0.5 items-center">
                  <span className="text-xs">{p.total_minions_killed ?? 0}</span>
                  <span className="text-xs">{csPerMin.toFixed(1)}/m</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-0.5 items-center">
                  {[
                    rawData?.stats.item0,
                    rawData?.stats.item1,
                    rawData?.stats.item2,
                    rawData?.stats.item3,
                    rawData?.stats.item4,
                    rawData?.stats.item5,
                    rawData?.stats.item6,
                  ].map((itemId, index) =>
                    itemId ? (
                      <Image
                        key={`${index}-${itemId}`}
                        src={`${DD_CDN}/${patch}/img/item/${itemId}.png`}
                        alt=""
                        width={22}
                        height={22}
                        className="rounded-sm"
                      />
                    ) : (
                      <div
                        key={`${index}-${itemId}`}
                        className="size-6 bg-muted rounded-sm"
                      />
                    ),
                  )}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
