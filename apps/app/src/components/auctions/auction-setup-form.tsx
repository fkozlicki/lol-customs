"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { AUCTION_POOL_SIZE } from "@v1/domain/auction";
import { formatRank } from "@v1/domain/rank";
import { parseRiotId, riotIdKey } from "@v1/domain/riot-id";
import { Button } from "@v1/ui/button";
import { cn } from "@v1/ui/cn";
import { Input } from "@v1/ui/input";
import { Label } from "@v1/ui/label";
import { toast } from "@v1/ui/sonner";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useUser } from "@/components/auth/user-context";
import { Icons } from "@/components/icons";
import { RankTag } from "@/components/rank-tag";
import { useScopedI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/react";

/** A player in the pool; the rank is the last one recorded in a ladder match. */
export interface PoolPlayer {
  gameName: string;
  tagLine: string;
  rankTier: string | null;
  rankDivision: string | null;
}

interface AuctionSetupFormProps {
  roomId?: string;
  initialPlayers?: PoolPlayer[];
  initialTeamName?: string;
  initialBudget?: number;
  initialBidSeconds?: number;
  initialRevealOrder?: boolean;
  onUpdated?: () => void;
}

function fingerprint(players: PoolPlayer[]) {
  return players.map(riotIdKey).sort().join("|");
}

export function AuctionSetupForm({
  roomId,
  initialPlayers = [],
  initialTeamName = "Team A",
  initialBudget = 20,
  initialBidSeconds = 30,
  initialRevealOrder = false,
  onUpdated,
}: AuctionSetupFormProps) {
  const t = useScopedI18n("dashboard.pages.auctions");
  const trpc = useTRPC();
  const router = useRouter();
  const { profile, isLoading, openSignInDialog } = useUser();
  const [pool, setPool] = useState<PoolPlayer[]>(initialPlayers);
  const [teamName, setTeamName] = useState(initialTeamName);
  const [budget, setBudget] = useState(initialBudget);
  const [bidSeconds, setBidSeconds] = useState(initialBidSeconds);
  const [revealOrder, setRevealOrder] = useState(initialRevealOrder);
  const [search, setSearch] = useState("");
  const [manualRiotId, setManualRiotId] = useState("");
  const [initialFingerprint] = useState(() => fingerprint(initialPlayers));

  const { data: allPlayers = [] } = useQuery(trpc.players.all.queryOptions());
  const poolKeys = useMemo(() => new Set(pool.map(riotIdKey)), [pool]);

  useEffect(() => {
    if (!roomId && !isLoading && !profile) openSignInDialog();
  }, [isLoading, openSignInDialog, profile, roomId]);

  const ladderPlayers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return allPlayers.filter((player) => {
      if (!player.game_name || !player.tag_line) return false;
      if (
        poolKeys.has(
          riotIdKey({ gameName: player.game_name, tagLine: player.tag_line }),
        )
      ) {
        return false;
      }
      return !query || player.game_name.toLowerCase().includes(query);
    });
  }, [allPlayers, poolKeys, search]);

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

  function addPlayer(entry: PoolPlayer): boolean {
    if (poolKeys.has(riotIdKey(entry))) {
      toast.error(t("creator.duplicate"));
      return false;
    }
    if (pool.length >= AUCTION_POOL_SIZE) return false;
    setPool((current) => [...current, entry]);
    return true;
  }

  function addFromRiotId() {
    const parsed = parseRiotId(manualRiotId);
    if (!parsed) {
      toast.error(t("creator.invalidRiotId"));
      return;
    }
    const known = allPlayers.find(
      (player) =>
        player.game_name &&
        player.tag_line &&
        riotIdKey({ gameName: player.game_name, tagLine: player.tag_line }) ===
          riotIdKey(parsed),
    );
    const added = addPlayer({
      ...parsed,
      rankTier: known?.rank_tier ?? null,
      rankDivision: known?.rank_division ?? null,
    });
    if (added) setManualRiotId("");
  }

  function removePlayer(entry: PoolPlayer) {
    setPool((current) =>
      current.filter((player) => riotIdKey(player) !== riotIdKey(entry)),
    );
  }

  function submit() {
    const players = pool.map(({ gameName, tagLine }) => ({
      gameName,
      tagLine,
    }));
    const settings = {
      teamName,
      budget,
      bidSeconds,
      showOrder: revealOrder,
    };

    if (roomId) {
      updateLobby.mutate({
        id: roomId,
        ...settings,
        ...(fingerprint(pool) !== initialFingerprint ? { players } : {}),
      });
    } else {
      createAuction.mutate({ players, ...settings });
    }
  }

  const isFull = pool.length === AUCTION_POOL_SIZE;
  const pending = createAuction.isPending || updateLobby.isPending;
  const valid =
    isFull &&
    teamName.trim().length > 0 &&
    teamName.length <= 100 &&
    budget >= 4 &&
    budget <= 100 &&
    bidSeconds >= 10 &&
    bidSeconds <= 60;

  return (
    <div className="space-y-14">
      <section>
        <StepHeading step="1" title={t("creator.roster")}>
          <div className="flex items-baseline gap-4">
            {pool.length > 0 && (
              <button
                type="button"
                onClick={() => setPool([])}
                className="label-caps underline-offset-4 hover:text-foreground hover:underline"
              >
                {t("creator.clear")}
              </button>
            )}
            <span className="num text-xl font-semibold">
              {pool.length}/{AUCTION_POOL_SIZE}
            </span>
          </div>
        </StepHeading>

        <div className="grid gap-10 md:grid-cols-2 md:gap-16">
          <div>
            {pool.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">
                {t("creator.rosterHint")}
              </p>
            ) : (
              <ul className="divide-y">
                {pool.map((entry) => (
                  <li
                    key={riotIdKey(entry)}
                    className="flex h-12 items-center gap-3"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {entry.gameName}
                    </span>
                    <RankTag tier={entry.rankTier}>
                      {formatRank(entry.rankTier, entry.rankDivision) ??
                        t("room.unranked")}
                    </RankTag>
                    <button
                      type="button"
                      onClick={() => removePlayer(entry)}
                      aria-label={t("creator.remove")}
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <Icons.X className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="label-caps pb-3 text-foreground">
              {t("creator.addPlayers")}
            </h3>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("creator.search")}
              aria-label={t("creator.search")}
            />
            <ul className="mt-2 max-h-72 divide-y overflow-y-auto">
              {ladderPlayers.length === 0 ? (
                <li className="py-4 text-sm text-muted-foreground">
                  {t("creator.noResults")}
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
                    <RankTag tier={player.rank_tier}>
                      {formatRank(player.rank_tier, player.rank_division) ??
                        t("room.unranked")}
                    </RankTag>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isFull}
                      onClick={() =>
                        player.game_name &&
                        player.tag_line &&
                        addPlayer({
                          gameName: player.game_name,
                          tagLine: player.tag_line,
                          rankTier: player.rank_tier,
                          rankDivision: player.rank_division,
                        })
                      }
                    >
                      {t("creator.add")}
                    </Button>
                  </li>
                ))
              )}
            </ul>

            <div className="mt-6 space-y-2">
              <Label htmlFor="auction-riot-id" className="label-caps">
                {t("creator.manual")}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="auction-riot-id"
                  value={manualRiotId}
                  onChange={(event) => setManualRiotId(event.target.value)}
                  placeholder={t("creator.riotIdPlaceholder")}
                  autoComplete="off"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addFromRiotId();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addFromRiotId}
                  disabled={isFull}
                >
                  {t("creator.add")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <StepHeading step="2" title={t("creator.rules")} />

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
          {isFull ? "" : t("creator.needEight")}
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
