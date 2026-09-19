"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import type { RouterOutputs } from "@v1/api";
import { Button } from "@v1/ui/button";
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

  const slots = Array.from(
    { length: 10 },
    (_, index) => players[index] ?? null,
  );
  const validated = validatedKey === rosterFingerprint;

  return (
    <div className="space-y-14">
      <section>
        <StepHeading
          step="1"
          title={t("creator.roster", { count: players.length })}
        >
          <span className="num label-caps text-foreground">
            {players.length}/10
          </span>
        </StepHeading>

        <ol className="grid gap-x-12 sm:grid-cols-2">
          {slots.map((player, index) => (
            <li
              key={player?.key ?? `slot-${index}`}
              className="flex h-14 items-center gap-3 border-b"
            >
              <span className="num w-5 shrink-0 text-xs text-muted-foreground">
                {index + 1}
              </span>
              {player ? (
                <>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {formatRiotId(player)}
                  </span>
                  {captainKey === player.key ? (
                    <span className="label-caps flex items-center gap-1.5 text-foreground">
                      <Icons.Captain className="size-3.5" />
                      {t("creator.youCaptain")}
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={Boolean(roomId)}
                      onClick={() => setCaptainKey(player.key)}
                      className="label-caps underline-offset-4 hover:text-foreground hover:underline disabled:opacity-40"
                    >
                      {t("creator.chooseAsYou")}
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label={t("creator.remove")}
                    onClick={() => removePlayer(player.key)}
                    disabled={lockedPlayerKeys.includes(player.key)}
                    className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                  >
                    <Icons.X className="size-4" />
                  </button>
                </>
              ) : (
                <span className="flex-1 border-b border-dashed" />
              )}
            </li>
          ))}
        </ol>
      </section>

      <section>
        <StepHeading step="2" title={t("creator.addPlayers")} />

        <div className="grid gap-10 md:grid-cols-2 md:gap-12">
          <div>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("creator.search")}
              aria-label={t("creator.search")}
            />
            <ul className="mt-2 max-h-60 divide-y overflow-y-auto">
              {availablePlayers.length === 0 ? (
                <li className="py-4 text-sm text-muted-foreground">
                  {t("creator.noResults")}
                </li>
              ) : (
                availablePlayers.slice(0, 80).map((player) => (
                  <li key={player.puuid}>
                    <button
                      type="button"
                      disabled={players.length >= 10}
                      onClick={() => addFromDb(player)}
                      className="flex h-12 w-full items-center justify-between gap-3 text-left text-sm disabled:opacity-40"
                    >
                      <span className="truncate font-medium">
                        {player.game_name}
                      </span>
                      <span className="label-caps">{t("creator.add")}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="space-y-2">
            <Label htmlFor="auction-riot-id" className="label-caps">
              {t("creator.manual")}
            </Label>
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
                variant="outline"
                onClick={addManual}
                disabled={players.length >= 10}
              >
                {t("creator.add")}
              </Button>
            </div>
            <p className="pt-4 text-xs text-muted-foreground">
              {t("creator.validationHint")}
            </p>
            <Button
              type="button"
              variant={validated ? "ghost" : "outline"}
              onClick={validateRoster}
              disabled={players.length !== 10 || loadRanks.isPending}
            >
              {loadRanks.isPending && (
                <Icons.Loader className="size-4 animate-spin" />
              )}
              {loadRanks.isPending
                ? t("creator.validating")
                : validated
                  ? t("creator.validated")
                  : t("creator.validate")}
            </Button>
          </div>
        </div>
      </section>

      <section>
        <StepHeading step="3" title={t("creator.rules")} />

        <div className="grid gap-6 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="auction-team-name" className="label-caps">
              {t("creator.teamName")}
            </Label>
            <Input
              id="auction-team-name"
              value={teamName}
              maxLength={100}
              onChange={(event) => setTeamName(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="auction-budget" className="label-caps">
              {t("creator.budget")}
            </Label>
            <Input
              id="auction-budget"
              type="number"
              min={4}
              max={100}
              value={budget}
              onChange={(event) => setBudget(event.target.valueAsNumber)}
              className="num"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="auction-timer" className="label-caps">
              {t("creator.timer")}
            </Label>
            <Input
              id="auction-timer"
              type="number"
              min={10}
              max={60}
              value={bidSeconds}
              onChange={(event) => setBidSeconds(event.target.valueAsNumber)}
              className="num"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setRevealOrder((value) => !value)}
          className="mt-6 flex w-full items-center gap-3 border-t pt-4 text-left"
        >
          <span
            className={cn(
              "flex size-5 shrink-0 items-center justify-center border",
              revealOrder && "border-foreground bg-foreground text-background",
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
      </section>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-6">
        <p className="text-xs text-muted-foreground">
          {players.length !== 10
            ? t("creator.needTen")
            : !captainKey
              ? t("creator.rosterHint")
              : !validated
                ? t("creator.validationHint")
                : ""}
        </p>
        <Button
          type="button"
          size="lg"
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
      </div>
    </div>
  );
}

function StepHeading({
  step,
  title,
  children,
}: {
  step: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 pb-4">
      <h2 className="flex items-baseline gap-3">
        <span className="num text-sm text-muted-foreground">{step}</span>
        <span className="text-xl font-semibold uppercase tracking-[-0.02em] sm:text-2xl">
          {title}
        </span>
      </h2>
      {children}
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
    <span className="label-caps inline-flex items-center gap-1.5">
      <RankCrest tier={tier} width={16} height={16} />
      {label || t("room.unranked")}
    </span>
  );
}
