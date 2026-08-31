"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import type { RouterOutputs } from "@v1/api";
import { Badge } from "@v1/ui/badge";
import { Button } from "@v1/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@v1/ui/card";
import { cn } from "@v1/ui/cn";
import { Icons } from "@v1/ui/icons";
import { Input } from "@v1/ui/input";
import { Label } from "@v1/ui/label";
import { toast } from "@v1/ui/sonner";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@/components/auth/user-context";
import { RankCrest } from "@/components/game-assets/rank-crest";
import { useScopedI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/react";
import { formatRiotId, parseRiotId, riotIdKey } from "@/utils/riot-id";
import { DEFAULT_PLATFORM_ID } from "./auction-contract";

type DbPlayer = RouterOutputs["players"]["all"][number];

export interface SetupPlayer {
  key: string;
  gameName: string;
  tagLine: string;
  platformId: string;
}

interface AuctionSetupFormProps {
  roomId?: string;
  initialPlayers?: SetupPlayer[];
  initialCaptainKey?: string;
  initialTeamName?: string;
  initialBudget?: number;
  initialBidSeconds?: number;
  initialRevealOrder?: boolean;
  lockedPlayerKeys?: string[];
  onUpdated?: () => void;
}

function fingerprint(players: SetupPlayer[]) {
  return players
    .map((player) => `${riotIdKey(player)}@${player.platformId}`)
    .sort()
    .join("|");
}

function entryKey() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function AuctionSetupForm({
  roomId,
  initialPlayers = [],
  initialCaptainKey = "",
  initialTeamName = "Team A",
  initialBudget = 20,
  initialBidSeconds = 30,
  initialRevealOrder = false,
  lockedPlayerKeys = [],
  onUpdated,
}: AuctionSetupFormProps) {
  const t = useScopedI18n("dashboard.pages.auctions");
  const trpc = useTRPC();
  const router = useRouter();
  const { profile, isLoading, openSignInDialog } = useUser();
  const [players, setPlayers] = useState<SetupPlayer[]>(initialPlayers);
  const [captainKey, setCaptainKey] = useState(initialCaptainKey);
  const [teamName, setTeamName] = useState(initialTeamName);
  const [budget, setBudget] = useState(initialBudget);
  const [bidSeconds, setBidSeconds] = useState(initialBidSeconds);
  const [revealOrder, setRevealOrder] = useState(initialRevealOrder);
  const [search, setSearch] = useState("");
  const [manualRiotId, setManualRiotId] = useState("");
  const initialFingerprint = useRef(fingerprint(initialPlayers));
  const [validatedKey, setValidatedKey] = useState<string | null>(() =>
    roomId ? initialFingerprint.current : null,
  );

  const { data: allPlayers = [] } = useQuery(trpc.players.all.queryOptions());
  const rosterKeys = useMemo(
    () => new Set(players.map((player) => riotIdKey(player))),
    [players],
  );
  const rosterFingerprint = fingerprint(players);
  const previousFingerprint = useRef(rosterFingerprint);

  useEffect(() => {
    if (previousFingerprint.current !== rosterFingerprint) {
      previousFingerprint.current = rosterFingerprint;
      setValidatedKey(null);
    }
  }, [rosterFingerprint]);

  useEffect(() => {
    if (!roomId && !isLoading && !profile) openSignInDialog();
  }, [isLoading, openSignInDialog, profile, roomId]);

  const availablePlayers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (allPlayers as DbPlayer[]).filter((player) => {
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

  const loadRanks = useMutation(
    trpc.auctions.validateRoster.mutationOptions({
      onSuccess: () => {
        setValidatedKey(rosterFingerprint);
        toast.success(t("creator.validationReady"));
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const createAuction = useMutation(
    trpc.auctions.create.mutationOptions({
      onSuccess: (room) => router.push(`/auctions/${room.id}`),
      onError: (error) => toast.error(error.message),
    }),
  );
  const updateLobby = useMutation(
    trpc.auctions.updateLobby.mutationOptions({
      onSuccess: () => {
        toast.success(t("creator.updated"));
        onUpdated?.();
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  function addPlayer(player: Omit<SetupPlayer, "key">) {
    if (players.length >= 10) return;
    if (rosterKeys.has(riotIdKey(player))) {
      toast.error(t("creator.duplicate"));
      return;
    }
    setPlayers((current) => [...current, { ...player, key: entryKey() }]);
  }

  function addFromDb(player: DbPlayer) {
    if (!player.game_name || !player.tag_line) return;
    addPlayer({
      gameName: player.game_name,
      tagLine: player.tag_line,
      platformId: player.platform_id ?? DEFAULT_PLATFORM_ID,
    });
  }

  function addManual() {
    const parsed = parseRiotId(manualRiotId);
    if (!parsed) {
      toast.error(t("creator.invalidRiotId"));
      return;
    }
    addPlayer({ ...parsed, platformId: DEFAULT_PLATFORM_ID });
    setManualRiotId("");
  }

  function removePlayer(key: string) {
    setPlayers((current) => current.filter((player) => player.key !== key));
    if (captainKey === key) setCaptainKey("");
  }

  function validateRoster() {
    if (players.length !== 10) {
      toast.error(t("creator.needTen"));
      return;
    }
    loadRanks.mutate({
      players: players.map(({ gameName, tagLine, platformId }) => ({
        gameName,
        tagLine,
        platformId,
      })),
    });
  }

  function submit() {
    const captain = players.find((player) => player.key === captainKey);
    if (!captain || validatedKey !== rosterFingerprint) return;
    const roster = players.map(({ gameName, tagLine, platformId }) => ({
      gameName,
      tagLine,
      platformId,
    }));
    const common = {
      players: roster,
      teamName,
      budget,
      bidSeconds,
      showOrder: revealOrder,
    };

    if (roomId) {
      updateLobby.mutate({
        id: roomId,
        teamName,
        budget,
        bidSeconds,
        showOrder: revealOrder,
        ...(rosterFingerprint !== initialFingerprint.current
          ? { players: roster }
          : {}),
      });
    } else {
      createAuction.mutate({
        ...common,
        captainRiotId: {
          gameName: captain.gameName,
          tagLine: captain.tagLine,
        },
      });
    }
  }

  const pending = createAuction.isPending || updateLobby.isPending;
  const valid =
    players.length === 10 &&
    Boolean(captainKey) &&
    validatedKey === rosterFingerprint &&
    teamName.trim().length > 0 &&
    teamName.length <= 100 &&
    budget >= 4 &&
    budget <= 100 &&
    bidSeconds >= 10 &&
    bidSeconds <= 60;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,.65fr)]">
      <Card className="overflow-hidden border-border/70">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center justify-between gap-3">
            <CardTitle>
              {t("creator.roster", { count: players.length })}
            </CardTitle>
            <Badge variant={players.length === 10 ? "default" : "secondary"}>
              {players.length}/10
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 pt-5">
          <div className="grid gap-2 sm:grid-cols-2">
            {players.map((player, index) => (
              <div
                key={player.key}
                className={cn(
                  "group flex min-w-0 items-center gap-3 rounded-xl border p-3 transition-colors",
                  captainKey === player.key &&
                    "border-amber-500/60 bg-amber-500/8",
                )}
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-xs">
                  {index + 1}
                </span>
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  disabled={Boolean(roomId)}
                  onClick={() => setCaptainKey(player.key)}
                >
                  <span className="block truncate text-sm font-semibold">
                    {formatRiotId(player)}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {captainKey === player.key
                      ? t("creator.youCaptain")
                      : t("creator.chooseAsYou")}
                  </span>
                </button>
                {captainKey === player.key && (
                  <Icons.Captain className="size-4 shrink-0 text-amber-500" />
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={t("creator.remove")}
                  onClick={() => removePlayer(player.key)}
                  disabled={lockedPlayerKeys.includes(player.key)}
                >
                  <Icons.X className="size-4" />
                </Button>
              </div>
            ))}
          </div>

          {players.length === 0 && (
            <div className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
              {t("creator.rosterHint")}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 border-t pt-5">
            <Button
              type="button"
              variant={
                validatedKey === rosterFingerprint ? "secondary" : "default"
              }
              onClick={validateRoster}
              disabled={players.length !== 10 || loadRanks.isPending}
            >
              {loadRanks.isPending && (
                <Icons.Loader className="size-4 animate-spin" />
              )}
              {loadRanks.isPending
                ? t("creator.validating")
                : validatedKey === rosterFingerprint
                  ? t("creator.validated")
                  : t("creator.validate")}
            </Button>
            <p className="text-xs text-muted-foreground">
              {t("creator.validationHint")}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("creator.addPlayers")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("creator.search")}
            />
            <div className="max-h-52 overflow-y-auto rounded-lg border">
              {availablePlayers.length === 0 ? (
                <p className="p-4 text-center text-sm text-muted-foreground">
                  {t("creator.noResults")}
                </p>
              ) : (
                availablePlayers.slice(0, 80).map((player) => (
                  <button
                    type="button"
                    key={player.puuid}
                    disabled={players.length >= 10}
                    onClick={() => addFromDb(player)}
                    className="flex w-full items-center justify-between border-b px-3 py-2.5 text-left text-sm last:border-0 hover:bg-muted/60 disabled:opacity-40"
                  >
                    <span className="truncate font-medium">
                      {player.game_name}#{player.tag_line}
                    </span>
                    <span className="text-muted-foreground">+</span>
                  </button>
                ))
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="auction-riot-id">{t("creator.manual")}</Label>
              <div className="flex gap-2">
                <Input
                  id="auction-riot-id"
                  value={manualRiotId}
                  onChange={(event) => setManualRiotId(event.target.value)}
                  placeholder={t("creator.riotIdPlaceholder")}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addManual();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={addManual}
                  disabled={players.length >= 10}
                >
                  {t("creator.add")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("creator.rules")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="auction-team-name">{t("creator.teamName")}</Label>
              <Input
                id="auction-team-name"
                value={teamName}
                maxLength={100}
                onChange={(event) => setTeamName(event.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="auction-budget">{t("creator.budget")}</Label>
                <Input
                  id="auction-budget"
                  type="number"
                  min={4}
                  max={100}
                  value={budget}
                  onChange={(event) => setBudget(event.target.valueAsNumber)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="auction-timer">{t("creator.timer")}</Label>
                <Input
                  id="auction-timer"
                  type="number"
                  min={10}
                  max={60}
                  value={bidSeconds}
                  onChange={(event) =>
                    setBidSeconds(event.target.valueAsNumber)
                  }
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => setRevealOrder((value) => !value)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                revealOrder && "border-primary/40 bg-primary/5",
              )}
            >
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded border",
                  revealOrder &&
                    "border-primary bg-primary text-primary-foreground",
                )}
              >
                {revealOrder && <Icons.Check className="size-3.5" />}
              </span>
              <span>
                <span className="block text-sm font-medium">
                  {t("creator.revealOrder")}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {t("creator.revealOrderHint")}
                </span>
              </span>
            </button>
            <Button
              type="button"
              size="lg"
              className="w-full"
              disabled={!valid || pending || (!roomId && !profile)}
              onClick={submit}
            >
              {pending && <Icons.Loader className="size-4 animate-spin" />}
              {pending
                ? t("creator.saving")
                : roomId
                  ? t("creator.save")
                  : t("creator.create")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function AuctionRank({
  tier,
  label,
}: {
  tier: string | null;
  label: string | null;
}) {
  const t = useScopedI18n("dashboard.pages.auctions");
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <RankCrest tier={tier} width={20} height={20} />
      {label || t("room.unranked")}
    </span>
  );
}
