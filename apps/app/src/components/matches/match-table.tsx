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

const DD_CDN = "https://ddragon.leagueoflegends.com/cdn";
const RANK_CRESTS_BASE =
  "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/";

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
}) {
  const result = isVictorious ? "Victory" : "Defeat";

  return (
    <Table className="w-full">
      <colgroup>
        <col className="w-auto" />
        <col className="w-[88px]" />
        <col className="w-[118px]" />
        <col className="w-[120px]" />
        <col className="w-[68px]" />
        <col className="w-[76px]" />
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
                <div className="flex items-center gap-2">
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
                    <span className="text-muted-foreground text-xs">
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
                <div className="flex items-center justify-center gap-2">
                  {p.op_score != null ? (
                    <span className="text-xs font-semibold">{p.op_score}</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                  <div className="flex gap-1">
                    {p.is_mvp && (
                      <span
                        className={cn(
                          "text-[10px] font-semibold px-1.5 py-0 rounded-full",
                          "bg-amber-500/20 text-amber-700 dark:text-amber-400",
                        )}
                      >
                        MVP
                      </span>
                    )}
                    {p.is_ace && (
                      <span
                        className={cn(
                          "text-[10px] font-semibold px-1.5 py-0 rounded-full",
                          "bg-slate-500/20 text-slate-700 dark:text-slate-300",
                        )}
                      >
                        ACE
                      </span>
                    )}
                  </div>
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
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
