"use client";

import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import type { RouterOutputs } from "@v1/api";
import { Button } from "@v1/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@v1/ui/card";
import { cn } from "@v1/ui/cn";
import { Icons } from "@v1/ui/icons";
import { Input } from "@v1/ui/input";
import { Label } from "@v1/ui/label";
import { Separator } from "@v1/ui/separator";
import { Skeleton } from "@v1/ui/skeleton";
import { toast } from "@v1/ui/sonner";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { RankCrest } from "@/components/game-assets/rank-crest";
import { useScopedI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/react";
import { positionRoleIconUrl } from "@/utils/asset-urls";
import type { EnrichedRosterPlayer } from "@/utils/random-teams";
import {
  buildRandomTeams,
  enrichPlayersFromRankLoad,
  type RandomTeamsResult,
  type RandomTeamsTeam,
} from "@/utils/random-teams";

const DEFAULT_PLATFORM_ID = "eun1";

type DbPlayer = RouterOutputs["players"]["all"][number];

interface RosterEntry {
  key: string;
  gameName: string;
  tagLine: string;
}

function newRosterKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function riotKey(gameName: string, tagLine: string): string {
  return `${gameName.trim().toLowerCase()}#${tagLine.trim().toLowerCase()}`;
}

/** Riot ID as `GameName#TagLine`; split on last `#` so names may contain `#`. */
function parseRiotIdInput(
  raw: string,
): { gameName: string; tagLine: string } | null {
  const s = raw.trim();
  const i = s.lastIndexOf("#");
  if (i <= 0 || i >= s.length - 1) return null;
  const gameName = s.slice(0, i).trim();
  const tagLine = s.slice(i + 1).trim();
  if (!gameName || !tagLine) return null;
  return { gameName, tagLine };
}

type TeamResult = RandomTeamsTeam;

function roleLabel(
  t: ReturnType<typeof useScopedI18n<"dashboard.pages.shuffle">>,
  role: string,
): string {
  if (role === "TOP") return t("roles.TOP");
  if (role === "JUNGLE") return t("roles.JUNGLE");
  if (role === "MID") return t("roles.MID");
  if (role === "ADC") return t("roles.ADC");
  if (role === "SUPPORT") return t("roles.SUPPORT");
  return role;
}

type TeamPlayer = TeamResult["players"][number];

function SoloRankDisplay({
  soloTier,
  soloRankLabel,
  unrankedLabel,
}: {
  soloTier: string | null | undefined;
  soloRankLabel: string;
  unrankedLabel: string;
}) {
  const hasTier = Boolean(soloTier?.trim());
  const label = hasTier ? soloRankLabel : unrankedLabel;
  const crestTier = hasTier && soloTier?.trim() ? soloTier : null;
  return (
    <div className="flex items-center gap-2">
      <RankCrest tier={crestTier} width={18} height={18} className="shrink-0" />
      <span className="text-muted-foreground text-sm leading-tight">
        {label}
      </span>
    </div>
  );
}

function RoleIcon({ role, label }: { role: string; label: string }) {
  return (
    <Image
      src={positionRoleIconUrl(role)}
      alt={label}
      width={20}
      height={20}
      className="block object-contain"
      title={label}
      unoptimized
    />
  );
}

function TeamTable({
  title,
  team,
  t,
}: {
  title: string;
  team: TeamResult;
  t: ReturnType<typeof useScopedI18n<"dashboard.pages.shuffle">>;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-lg font-medium">{title}</div>
        <span className="text-foreground inline-flex items-center gap-1.5 font-medium">
          <RankCrest
            tier={team.avgSoloTier}
            width={24}
            height={24}
            className="shrink-0"
          />
          <span className="capitalize text-sm">{team.avgSoloRank}</span>
        </span>
      </div>
      <div className="space-y-2">
        {team.players.map((p: TeamPlayer) => (
          <div
            key={`${p.gameName}-${p.tagLine}-${p.role}`}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border-border/50 border"
          >
            <div className="flex items-center gap-2">
              <RoleIcon role={p.role} label={roleLabel(t, p.role)} />
            </div>

            <div className="inline-flex items-center gap-1.5 flex-1">
              <span className="text-foreground font-medium">{p.gameName}</span>
              {p.isCaptain && (
                <Icons.Captain className="size-4 text-amber-500" />
              )}
            </div>

            <SoloRankDisplay
              soloTier={p.soloTier}
              soloRankLabel={p.soloRankLabel}
              unrankedLabel={t("unranked")}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function RandomTeamsToolSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
      <Skeleton className="h-10 w-48" />
    </div>
  );
}

export default function RandomTeamsTool() {
  const t = useScopedI18n("dashboard.pages.shuffle");
  const trpc = useTRPC();
  const { data: allPlayers } = useSuspenseQuery(
    trpc.players.all.queryOptions(),
  );

  const [search, setSearch] = useState("");
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [manualRiotId, setManualRiotId] = useState("");
  const [enrichedRoster, setEnrichedRoster] = useState<
    EnrichedRosterPlayer[] | null
  >(null);
  const [teams, setTeams] = useState<RandomTeamsResult | null>(null);

  const rosterKeys = useMemo(
    () => new Set(roster.map((r) => riotKey(r.gameName, r.tagLine))),
    [roster],
  );

  const ladderPlayers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (allPlayers as DbPlayer[]).filter((p) => {
      if (!p.game_name || !p.tag_line) return false;
      if (rosterKeys.has(riotKey(p.game_name, p.tag_line))) return false;
      if (!q) return true;
      return p.game_name.toLowerCase().includes(q);
    });
  }, [allPlayers, rosterKeys, search]);

  const loadRanksMutationOpts = useMemo(
    () =>
      trpc.riot.loadRosterRanks.mutationOptions({
        onError: (err) => {
          toast.error(err.message);
        },
      }),
    [trpc],
  );
  const loadRanks = useMutation(loadRanksMutationOpts);

  const loadRequest = useMemo(() => {
    if (roster.length !== 10) return null;
    const players = [...roster]
      .map((r) => ({
        gameName: r.gameName.trim(),
        tagLine: r.tagLine.trim(),
        platformId: DEFAULT_PLATFORM_ID,
      }))
      .sort((a, b) =>
        `${a.gameName}#${a.tagLine}`.localeCompare(
          `${b.gameName}#${b.tagLine}`,
        ),
      );
    const key = players
      .map((p) => `${p.gameName}#${p.tagLine}@${p.platformId}`)
      .join("|");
    return { key, players };
  }, [roster]);

  const loadRequestRef = useRef(loadRequest);
  loadRequestRef.current = loadRequest;
  const rankFetchGen = useRef(0);

  // deps: roster fingerprint only — do not add loadRanks (unstable across renders).
  useEffect(() => {
    const key = loadRequest?.key;
    if (key == null || key === "") return;

    const req = loadRequestRef.current;
    if (!req || req.key !== key) return;

    rankFetchGen.current += 1;
    const gen = rankFetchGen.current;
    const expectedKey = key;

    loadRanks.mutate(
      { players: req.players },
      {
        onSuccess: (data) => {
          if (gen !== rankFetchGen.current) return;
          const latest = loadRequestRef.current;
          if (!latest || latest.key !== expectedKey) return;
          setEnrichedRoster(enrichPlayersFromRankLoad(data));
          setTeams(null);
        },
      },
    );
  }, [loadRequest?.key]);

  function addToRoster(entry: Omit<RosterEntry, "key">): boolean {
    const key = riotKey(entry.gameName, entry.tagLine);
    if (rosterKeys.has(key)) {
      toast.error(t("toastDuplicate"));
      return false;
    }
    if (roster.length >= 10) {
      return false;
    }
    setRoster((prev) => [...prev, { ...entry, key: newRosterKey() }]);
    setEnrichedRoster(null);
    setTeams(null);
    return true;
  }

  function removeFromRoster(key: string) {
    setRoster((prev) => prev.filter((r) => r.key !== key));
    setEnrichedRoster(null);
    setTeams(null);
  }

  function addFromDb(p: DbPlayer) {
    if (!p.game_name || !p.tag_line) return;
    addToRoster({
      gameName: p.game_name,
      tagLine: p.tag_line,
    });
  }

  function addManual() {
    const parsed = parseRiotIdInput(manualRiotId);
    if (!parsed) {
      toast.error(t("toastInvalidRiot"));
      return;
    }
    if (
      addToRoster({
        gameName: parsed.gameName,
        tagLine: parsed.tagLine,
      })
    ) {
      setManualRiotId("");
    }
  }

  function handleRollTeams() {
    if (!enrichedRoster) {
      return;
    }
    setTeams(buildRandomTeams(enrichedRoster));
  }

  return (
    <div className="space-y-8">
      {teams && (
        <div className="grid grid-cols-[1fr_1px_1fr] gap-6 items-center bg-background rounded-xl border overflow-hidden p-6">
          <TeamTable title={t("teamA")} team={teams.teamA} t={t} />
          <Separator orientation="vertical" />
          <TeamTable title={t("teamB")} team={teams.teamB} t={t} />
        </div>
      )}
      <div className="flex gap-6 w-full">
        <Card className="flex-3/5">
          <CardHeader>
            <CardTitle className="text-base">
              {t("rosterHeading", { count: roster.length })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {roster.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t("rosterHint")}</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {roster.map((r) => (
                  <li
                    key={r.key}
                    className="bg-muted/50 flex items-center gap-2 rounded-full px-3 py-1 text-sm"
                  >
                    <span>{r.gameName}</span>
                    <Button
                      type="button"
                      size="icon-xs"
                      variant="ghost"
                      className="shrink-0 rounded-full"
                      onClick={() => removeFromRoster(r.key)}
                      aria-label={t("removePlayer")}
                    >
                      <Icons.X className="size-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="lg"
                className="gap-2"
                disabled={
                  roster.length !== 10 || loadRanks.isPending || !enrichedRoster
                }
                onClick={handleRollTeams}
              >
                <Icons.RandomTeams className="size-4" />
                {teams ? t("reroll") : t("generate")}
              </Button>
              {roster.length === 10 &&
                loadRanks.isPending &&
                !enrichedRoster && (
                  <p className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Icons.Loader className="size-4 animate-spin shrink-0" />
                    {t("loadingRanks")}
                  </p>
                )}
              {enrichedRoster && (
                <p className="text-muted-foreground text-sm">
                  {t("ranksLoaded")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="basis-2/5">
          <CardHeader>
            <CardTitle className="text-base">{t("fromLadder")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchPlaceholder")}
            />
            <div
              className={cn(
                "max-h-56 overflow-y-auto rounded-md border",
                "text-sm",
              )}
            >
              {ladderPlayers.length === 0 ? (
                <p className="text-muted-foreground p-3 text-center text-sm">
                  {search.trim() ? t("noSearchResults") : t("rosterHint")}
                </p>
              ) : (
                <ul className="divide-y">
                  {ladderPlayers.slice(0, 80).map((p) => (
                    <li
                      key={p.puuid}
                      className="flex items-center justify-between gap-2 px-3 py-2"
                    >
                      <span className="min-w-0 truncate font-medium">
                        {p.game_name}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={roster.length >= 10}
                        onClick={() => addFromDb(p)}
                      >
                        {t("addPlayer")}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rt-riot-id">{t("riotIdLabel")}</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="rt-riot-id"
                  value={manualRiotId}
                  onChange={(e) => setManualRiotId(e.target.value)}
                  placeholder={t("riotIdPlaceholder")}
                  autoComplete="off"
                />
                <Button
                  type="button"
                  onClick={addManual}
                  disabled={roster.length >= 10}
                >
                  {t("addPlayer")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
