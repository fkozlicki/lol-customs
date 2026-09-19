"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import type { RouterOutputs } from "@v1/api";
import { Button } from "@v1/ui/button";
import { cn } from "@v1/ui/cn";
import { Icons } from "@v1/ui/icons";
import { Input } from "@v1/ui/input";
import { Skeleton } from "@v1/ui/skeleton";
import { toast } from "@v1/ui/sonner";
import Image from "next/image";
import { useMemo, useState } from "react";
import { RankCrest } from "@/components/game-assets/rank-crest";
import { useScopedI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/react";
import { positionRoleIconUrl } from "@/utils/asset-urls";
import {
  buildRandomTeams,
  formatRank,
  type RandomTeamsResult,
  type RandomTeamsTeam,
  type RandomTeamsTeamPlayer,
  type RosterPlayer,
} from "@/utils/random-teams";
import { parseRiotId, riotIdKey } from "@/utils/riot-id";

const ROSTER_SIZE = 10;

type DbPlayer = RouterOutputs["players"]["all"][number];
type ShuffleCopy = ReturnType<typeof useScopedI18n<"dashboard.pages.shuffle">>;

export default function RandomTeamsTool() {
  const t = useScopedI18n("dashboard.pages.shuffle");
  const trpc = useTRPC();
  const { data: allPlayers } = useSuspenseQuery(
    trpc.players.all.queryOptions(),
  );

  const [search, setSearch] = useState("");
  const [manualRiotId, setManualRiotId] = useState("");
  const [roster, setRoster] = useState<RosterPlayer[]>([]);
  const [teams, setTeams] = useState<RandomTeamsResult | null>(null);

  const rosterKeys = useMemo(
    () => new Set(roster.map((entry) => riotIdKey(entry))),
    [roster],
  );

  const ladderPlayers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return allPlayers.filter((player) => {
      if (!player.game_name || !player.tag_line) return false;
      if (
        rosterKeys.has(
          riotIdKey({ gameName: player.game_name, tagLine: player.tag_line }),
        )
      ) {
        return false;
      }
      return !query || player.game_name.toLowerCase().includes(query);
    });
  }, [allPlayers, rosterKeys, search]);

  function addPlayer(entry: RosterPlayer): boolean {
    if (rosterKeys.has(riotIdKey(entry))) {
      toast.error(t("toastDuplicate"));
      return false;
    }
    if (roster.length >= ROSTER_SIZE) return false;
    setRoster((prev) => [...prev, entry]);
    setTeams(null);
    return true;
  }

  function addFromLadder(player: DbPlayer) {
    if (!player.game_name || !player.tag_line) return;
    addPlayer({
      gameName: player.game_name,
      tagLine: player.tag_line,
      rankTier: player.rank_tier,
      rankDivision: player.rank_division,
    });
  }

  function addFromRiotId() {
    const parsed = parseRiotId(manualRiotId);
    if (!parsed) {
      toast.error(t("toastInvalidRiot"));
      return;
    }
    const known = allPlayers.find(
      (player) =>
        player.game_name &&
        player.tag_line &&
        riotIdKey({
          gameName: player.game_name,
          tagLine: player.tag_line,
        }) === riotIdKey(parsed),
    );
    const added = addPlayer({
      ...parsed,
      rankTier: known?.rank_tier ?? null,
      rankDivision: known?.rank_division ?? null,
    });
    if (added) setManualRiotId("");
  }

  function removePlayer(entry: RosterPlayer) {
    setRoster((prev) => prev.filter((r) => riotIdKey(r) !== riotIdKey(entry)));
    setTeams(null);
  }

  const isFull = roster.length === ROSTER_SIZE;

  return (
    <div className="space-y-10">
      {teams && (
        <section className="grid gap-10 md:grid-cols-2 md:gap-16">
          <TeamColumn title={t("teamA")} team={teams.teamA} t={t} />
          <TeamColumn title={t("teamB")} team={teams.teamB} t={t} />
        </section>
      )}

      <div className="sticky top-14 z-20 flex items-center justify-between gap-4 border-b bg-background/90 py-4 backdrop-blur">
        <div className="flex items-baseline gap-4">
          <span className="num text-xl font-semibold">
            {roster.length}/{ROSTER_SIZE}
          </span>
          {roster.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setRoster([]);
                setTeams(null);
              }}
              className="label-caps underline-offset-4 hover:text-foreground hover:underline"
            >
              {t("clearRoster")}
            </button>
          )}
        </div>
        <Button
          type="button"
          disabled={!isFull}
          onClick={() => setTeams(buildRandomTeams(roster))}
        >
          <Icons.RandomTeams className="size-4" />
          {teams ? t("reroll") : t("generate")}
        </Button>
      </div>

      <div className="grid gap-10 md:grid-cols-2 md:gap-16">
        <section>
          <h2 className="label-caps pb-3 text-foreground">
            {t("rosterTitle")}
          </h2>

          {roster.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">
              {t("rosterHint")}
            </p>
          ) : (
            <ul className="divide-y">
              {roster.map((entry) => (
                <li
                  key={riotIdKey(entry)}
                  className="flex h-12 items-center gap-3"
                >
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {entry.gameName}
                  </span>
                  <RankTag
                    tier={entry.rankTier}
                    division={entry.rankDivision}
                    unrankedLabel={t("unranked")}
                  />
                  <button
                    type="button"
                    onClick={() => removePlayer(entry)}
                    aria-label={t("removePlayer")}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Icons.X className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="label-caps pb-3 text-foreground">{t("fromLadder")}</h2>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
          />

          <ul className="mt-2 max-h-72 divide-y overflow-y-auto">
            {ladderPlayers.length === 0 ? (
              <li className="py-4 text-sm text-muted-foreground">
                {search.trim() ? t("noSearchResults") : t("rosterHint")}
              </li>
            ) : (
              ladderPlayers.slice(0, 80).map((player) => (
                <li
                  key={player.puuid}
                  className="flex h-12 items-center gap-3 pr-1"
                >
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {player.game_name}
                  </span>
                  <RankTag
                    tier={player.rank_tier}
                    division={player.rank_division}
                    unrankedLabel={t("unranked")}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isFull}
                    onClick={() => addFromLadder(player)}
                  >
                    {t("addPlayer")}
                  </Button>
                </li>
              ))
            )}
          </ul>

          <div className="mt-6 space-y-2">
            <label htmlFor="shuffle-riot-id" className="label-caps">
              {t("riotIdLabel")}
            </label>
            <div className="flex items-center gap-2">
              <Input
                id="shuffle-riot-id"
                value={manualRiotId}
                onChange={(event) => setManualRiotId(event.target.value)}
                placeholder={t("riotIdPlaceholder")}
                autoComplete="off"
              />
              <Button
                type="button"
                variant="outline"
                onClick={addFromRiotId}
                disabled={isFull}
              >
                {t("addPlayer")}
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function TeamColumn({
  title,
  team,
  t,
}: {
  title: string;
  team: RandomTeamsTeam;
  t: ShuffleCopy;
}) {
  return (
    <section>
      <div className="flex items-baseline justify-between pb-3">
        <h2 className="text-2xl font-semibold uppercase leading-none tracking-[-0.03em] sm:text-3xl">
          {title}
        </h2>
        <span className="flex items-center gap-1.5">
          <RankCrest
            tier={team.avgRankTier}
            width={18}
            height={18}
            className="shrink-0"
          />
          <span className="label-caps">
            {t("avgSolo")} {team.avgRankLabel}
          </span>
        </span>
      </div>
      <ul className="divide-y border-t">
        {team.players.map((player) => (
          <TeamRow key={riotIdKey(player)} player={player} t={t} />
        ))}
      </ul>
    </section>
  );
}

function TeamRow({
  player,
  t,
}: {
  player: RandomTeamsTeamPlayer;
  t: ShuffleCopy;
}) {
  const roleLabel = t(`roles.${player.role}` as "roles.TOP");

  return (
    <li className="flex h-14 items-center gap-3">
      <Image
        src={positionRoleIconUrl(player.role)}
        alt={roleLabel}
        title={roleLabel}
        width={20}
        height={20}
        className="shrink-0 object-contain"
        unoptimized
      />
      <span className="min-w-0 flex-1 truncate text-sm font-medium">
        {player.gameName}
        {player.isCaptain && (
          <span className="label-caps ml-2">{t("captain")}</span>
        )}
      </span>
      <RankTag
        tier={player.rankTier}
        division={player.rankDivision}
        unrankedLabel={t("unranked")}
      />
    </li>
  );
}

/** Last rank recorded for the player in a ladder match. */
function RankTag({
  tier,
  division,
  unrankedLabel,
  className,
}: {
  tier: string | null;
  division: string | null;
  unrankedLabel: string;
  className?: string;
}) {
  const label = formatRank(tier, division);

  return (
    <span className={cn("flex shrink-0 items-center gap-1.5", className)}>
      <RankCrest tier={tier} width={16} height={16} className="shrink-0" />
      <span className="label-caps">{label ?? unrankedLabel}</span>
    </span>
  );
}

export function RandomTeamsToolSkeleton() {
  return (
    <div className="grid gap-10 md:grid-cols-2 md:gap-16">
      <Skeleton className="h-96 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}
