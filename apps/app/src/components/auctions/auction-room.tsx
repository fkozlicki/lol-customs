"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AUCTION_POOL_SIZE } from "@v1/domain/auction";
import { Button } from "@v1/ui/button";
import { Card, CardContent } from "@v1/ui/card";
import { cn } from "@v1/ui/cn";
import { Input } from "@v1/ui/input";
import { Skeleton } from "@v1/ui/skeleton";
import { toast } from "@v1/ui/sonner";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useUser } from "@/components/auth/user-context";
import { Icons } from "@/components/icons";
import { PageShell } from "@/components/page-shell";
import { RankTag } from "@/components/rank-tag";
import { useScopedI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/react";
import {
  type AuctionEvent,
  type AuctionRoomSnapshot,
  type AuctionSide,
  captainFor,
  playersFor,
} from "./auction-contract";
import { AuctionCountdown } from "./auction-countdown";
import { ConnectionBadge } from "./auction-list";
import { AuctionSetupForm } from "./auction-setup-form";
import { useAuctionRealtime } from "./use-auction-realtime";

function TeamRoster({
  room,
  side,
}: {
  room: AuctionRoomSnapshot;
  side: AuctionSide;
}) {
  const t = useScopedI18n("dashboard.pages.auctions");
  const captain = captainFor(room, side);
  const players = playersFor(room, side);
  const remaining = captain?.budgetRemaining ?? room.budget;
  const spent = room.budget - remaining;
  const isLeading = room.currentLeaderSide === side;
  const slots = Array.from({ length: 4 }, (_, index) => players[index] ?? null);

  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="min-w-0 truncate text-xl font-semibold uppercase tracking-[-0.02em]">
            {captain?.teamName ?? t(`room.team${side}`)}
          </h2>
          <span className="num shrink-0 text-2xl font-semibold">
            ${remaining}
          </span>
        </div>
        <div className="flex h-1 bg-foreground/15">
          <div
            className="bg-foreground"
            style={{ width: `${(spent / room.budget) * 100}%` }}
          />
        </div>
        {isLeading && (
          <span className="label-caps block text-foreground">
            {t("room.leadingShort")}
          </span>
        )}
      </div>

      <ol className="divide-y border-b">
        <li className="flex h-14 items-center gap-3">
          <span className="num w-4 shrink-0 text-xs text-muted-foreground">
            1
          </span>
          <div className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5 truncate text-sm font-medium">
              {captain?.profileNickname ?? t("lobby.openSlot")}
              <Icons.Captain className="size-3.5 shrink-0 text-muted-foreground" />
            </span>
            <span className="label-caps">{t("room.captain")}</span>
          </div>
        </li>
        {slots.map((player, index) => (
          <li
            key={player?.id ?? `empty-${side}-${index}`}
            className="flex h-14 items-center gap-3"
          >
            <span className="num w-4 shrink-0 text-xs text-muted-foreground">
              {index + 2}
            </span>
            {player ? (
              <>
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {player.gameName}
                  </span>
                  <RankTag tier={player.soloTier}>
                    {player.soloRankLabel || t("room.unranked")}
                  </RankTag>
                </div>
                {player.purchasePrice != null && (
                  <span className="num shrink-0 text-sm">
                    ${player.purchasePrice}
                  </span>
                )}
              </>
            ) : (
              <span className="flex-1 border-b border-dashed" />
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

function EventFeed({ room }: { room: AuctionRoomSnapshot }) {
  const t = useScopedI18n("dashboard.pages.auctions");
  const playerById = new Map(room.players.map((player) => [player.id, player]));

  function eventText(event: AuctionEvent) {
    const player = event.playerId ? playerById.get(event.playerId) : undefined;
    const name = player ? player.gameName : t("feed.player");
    const team = event.side
      ? (captainFor(room, event.side)?.teamName ?? event.side)
      : "";
    if (event.type === "bid")
      return t("feed.bid", { team, amount: event.amount ?? 0, player: name });
    if (event.type === "opening_bid")
      return t("feed.openingBid", { team, player: name });
    if (event.type === "concede")
      return t("feed.concede", { team, player: name });
    if (event.type === "pass") return t("feed.pass", { team, player: name });
    if (event.type === "sold")
      return t("feed.sold", { team, amount: event.amount ?? 0, player: name });
    if (event.type === "auto_assigned")
      return t("feed.autoAssigned", { team, player: name });
    if (event.type === "captain_joined") return t("feed.joined", { team });
    if (event.type === "captain_left") return t("feed.left");
    if (event.type === "captain_removed") return t("feed.removed");
    if (event.type === "countdown_started") return t("feed.countdown");
    if (event.type === "countdown_cancelled")
      return t("feed.countdownCancelled");
    if (event.type === "auction_started") return t("feed.started");
    if (event.type === "player_revealed")
      return t("feed.revealed", { player: name });
    if (event.type === "completed") return t("feed.completed");
    if (event.type === "cancelled") return t("feed.cancelled");
    if (event.type === "lobby_updated") return t("feed.lobbyUpdated", { team });
    if (event.type === "ready_changed")
      return event.payload.ready
        ? t("feed.ready", { team })
        : t("feed.unready", { team });
    return t("feed.created");
  }

  return (
    <section>
      <h2 className="label-caps pb-2 text-foreground">{t("feed.title")}</h2>
      {room.events.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("feed.empty")}</p>
      ) : (
        <ol className="max-h-[420px] divide-y overflow-y-auto">
          {[...room.events].reverse().map((event) => (
            <li key={event.id} className="flex items-baseline gap-3 py-2.5">
              <time className="num shrink-0 text-[11px] text-muted-foreground">
                {new Date(event.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
              <p className="text-sm">{eventText(event)}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function ActiveStage({
  room,
  refresh,
}: {
  room: AuctionRoomSnapshot;
  refresh: () => void;
}) {
  const t = useScopedI18n("dashboard.pages.auctions");
  const current = room.players.find(
    (player) => player.id === room.currentPlayerId,
  );
  const opening = [...room.events]
    .reverse()
    .find(
      (event) =>
        event.type === "opening_bid" && event.playerId === room.currentPlayerId,
    );
  const openerTeam = opening?.side
    ? (captainFor(room, opening.side)?.teamName ?? opening.side)
    : null;

  return (
    <section className="flex min-h-[26rem] flex-col justify-between gap-8 border-b pb-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <span className="label-caps block text-foreground">
            {t(`phase.${room.phase ?? "bidding"}`)}
          </span>
          {room.roundNumber > 0 && (
            <span className="label-caps block">
              {t("room.round", {
                round: room.roundNumber,
                total: AUCTION_POOL_SIZE,
              })}
            </span>
          )}
        </div>
        {room.currentLeaderSide && (
          <span className="label-caps bg-foreground px-2 py-1 text-background">
            {t("room.leading", {
              team:
                captainFor(room, room.currentLeaderSide)?.teamName ??
                room.currentLeaderSide,
            })}
          </span>
        )}
      </div>

      {current ? (
        <>
          <div className="flex flex-col items-center gap-2 text-center">
            <h2 className="max-w-full truncate text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">
              {current.gameName}
            </h2>
            <RankTag tier={current.soloTier}>
              {current.soloRankLabel || t("room.unranked")}
            </RankTag>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 sm:items-end">
            <div>
              <p className="label-caps">{t("room.currentPrice")}</p>
              <p className="num text-6xl font-semibold leading-none sm:text-7xl">
                ${room.currentBid ?? 0}
              </p>
              {openerTeam && room.phase !== "sold_pause" && (
                <p className="label-caps mt-2">
                  {t("room.opened", { team: openerTeam })}
                </p>
              )}
            </div>
            <div className="sm:text-right">
              {room.phaseEndsAt && room.phase !== "sold_pause" ? (
                <AuctionCountdown
                  deadline={room.phaseEndsAt}
                  serverNow={room.serverNow}
                  durationSeconds={room.bidSeconds}
                />
              ) : (
                <p className="text-lg font-semibold uppercase tracking-[-0.02em]">
                  {t("room.soldPause")}
                </p>
              )}
            </div>
          </div>

          {room.permissions.mySide && room.phase !== "sold_pause" && (
            <RoundControls
              key={room.currentPlayerId}
              room={room}
              refresh={refresh}
            />
          )}
        </>
      ) : (
        <p className="text-center text-muted-foreground">
          {t("room.preparingPlayer")}
        </p>
      )}
    </section>
  );
}

/** Keyed by the current player, so the bid amount starts from the minimum every round. */
function RoundControls({
  room,
  refresh,
}: {
  room: AuctionRoomSnapshot;
  refresh: () => void;
}) {
  const t = useScopedI18n("dashboard.pages.auctions");
  const trpc = useTRPC();
  const mySide = room.permissions.mySide;
  const myBudget = mySide
    ? (captainFor(room, mySide)?.budgetRemaining ?? 0)
    : 0;
  const minimumBid = (room.currentBid ?? 0) + 1;
  const [amount, setAmount] = useState(minimumBid);
  // keep a legally-entered higher bid instead of snapping back to the minimum
  useEffect(() => {
    setAmount((current) =>
      current < minimumBid ? minimumBid : Math.min(current, myBudget),
    );
  }, [minimumBid, myBudget]);

  const failed = (error: { message: string }) => {
    toast.error(error.message);
    refresh();
  };
  const bid = useMutation(
    trpc.auctions.bid.mutationOptions({ onSuccess: refresh, onError: failed }),
  );
  const pass = useMutation(
    trpc.auctions.pass.mutationOptions({ onSuccess: refresh, onError: failed }),
  );
  const take = useMutation(
    trpc.auctions.take.mutationOptions({ onSuccess: refresh, onError: failed }),
  );
  const { canBid, canConcede, canPass, canTake } = room.permissions;
  const busy = bid.isPending || pass.isPending || take.isPending;

  if (room.phase === "free_auction") {
    return (
      <div className="space-y-3 border-t pt-6">
        {canTake ? (
          <>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                size="lg"
                disabled={busy}
                onClick={() => take.mutate({ id: room.id })}
              >
                {t("actions.takeForOne")}
              </Button>
              <Button
                size="lg"
                variant="outline"
                disabled={!canPass || busy}
                onClick={() => pass.mutate({ id: room.id })}
              >
                {t("actions.pass")}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("room.freeAuctionHint")}
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">{t("room.iAmBroke")}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 border-t pt-6">
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="flex gap-2">
          <Input
            type="number"
            min={minimumBid}
            max={myBudget}
            value={Number.isNaN(amount) ? "" : amount}
            onChange={(event) => setAmount(event.target.valueAsNumber)}
            aria-label={t("actions.customBid")}
            className="num h-11 w-24 text-lg"
          />
          <Button
            size="lg"
            className="flex-1"
            disabled={
              !canBid || busy || amount < minimumBid || amount > myBudget
            }
            onClick={() => bid.mutate({ id: room.id, amount })}
          >
            {t("actions.bid")} ${Number.isNaN(amount) ? "" : amount}
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            size="lg"
            variant="outline"
            disabled={!canBid || busy}
            onClick={() => bid.mutate({ id: room.id, amount: minimumBid })}
          >
            +1
          </Button>
          <Button
            size="lg"
            variant="outline"
            disabled={!canBid || busy}
            onClick={() => bid.mutate({ id: room.id, amount: myBudget })}
          >
            {t("actions.allIn")}
          </Button>
          <Button
            size="lg"
            variant="ghost"
            disabled={!canConcede || busy}
            onClick={() => pass.mutate({ id: room.id })}
          >
            {t("actions.concede")}
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{t("room.concedeHint")}</p>
    </div>
  );
}

function Lobby({
  room,
  refresh,
}: {
  room: AuctionRoomSnapshot;
  refresh: () => void;
}) {
  const t = useScopedI18n("dashboard.pages.auctions");
  const trpc = useTRPC();
  const [editing, setEditing] = useState(false);
  const me = room.permissions.mySide
    ? captainFor(room, room.permissions.mySide)
    : undefined;
  const ready = useMutation(
    trpc.auctions.setReady.mutationOptions({
      onSuccess: refresh,
      onError: (error) => {
        toast.error(error.message);
        refresh();
      },
    }),
  );

  return (
    <div className="space-y-12">
      {room.countdownEndsAt && (
        <div className="space-y-2">
          <p className="label-caps text-foreground">{t("lobby.starting")}</p>
          <AuctionCountdown
            deadline={room.countdownEndsAt}
            serverNow={room.serverNow}
            durationSeconds={5}
          />
        </div>
      )}

      <section className="grid gap-8 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:gap-12">
        <LobbyTeam room={room} side="A" refresh={refresh} />
        <span className="label-caps hidden pt-2 sm:block">vs</span>
        <LobbyTeam room={room} side="B" refresh={refresh} />
      </section>

      {me && (
        <Button
          size="lg"
          disabled={!room.permissions.canReady || ready.isPending}
          onClick={() => ready.mutate({ id: room.id, ready: !me.ready })}
        >
          {me.ready ? t("actions.unready") : t("actions.ready")}
        </Button>
      )}

      {editing ? (
        <AuctionSetupForm
          roomId={room.id}
          initialPlayers={room.players.map((player) => ({
            gameName: player.gameName,
            tagLine: player.tagLine,
            rankTier: player.soloTier,
            rankDivision: player.soloDivision,
          }))}
          initialBudget={room.budget}
          initialBidSeconds={room.bidSeconds}
          initialRevealOrder={room.showOrder}
          onUpdated={() => {
            setEditing(false);
            refresh();
          }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <section>
          <div className="flex items-baseline justify-between gap-4 border-b pb-3">
            <h2 className="label-caps text-foreground">
              {t("creator.roster")}
            </h2>
            {room.permissions.canEditLobby && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="label-caps underline-offset-4 hover:text-foreground hover:underline"
              >
                {t("lobby.edit")}
              </button>
            )}
          </div>
          <ul className="grid gap-x-12 sm:grid-cols-2">
            {room.players.map((player) => (
              <li
                key={player.id}
                className="flex h-12 items-center gap-3 border-b"
              >
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {player.gameName}
                </span>
                <RankTag tier={player.soloTier}>
                  {player.soloRankLabel || t("room.unranked")}
                </RankTag>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function LobbyTeam({
  room,
  side,
  refresh,
}: {
  room: AuctionRoomSnapshot;
  side: AuctionSide;
  refresh: () => void;
}) {
  const t = useScopedI18n("dashboard.pages.auctions");
  const trpc = useTRPC();
  const captain = captainFor(room, side);
  const { mySide, canLeave, canRemoveCaptain } = room.permissions;
  const queryClient = useQueryClient();
  const failed = (error: { message: string }) => {
    toast.error(error.message);
    refresh();
  };
  const captainChanged = () => {
    refresh();
    void queryClient.invalidateQueries(trpc.auctions.listActive.queryOptions());
  };
  const leave = useMutation(
    trpc.auctions.leaveCaptain.mutationOptions({
      onSuccess: captainChanged,
      onError: failed,
    }),
  );
  const remove = useMutation(
    trpc.auctions.removeCaptain.mutationOptions({
      onSuccess: captainChanged,
      onError: failed,
    }),
  );
  const [renaming, setRenaming] = useState(false);
  const [teamName, setTeamName] = useState("");
  const rename = useMutation(
    trpc.auctions.updateLobby.mutationOptions({
      onSuccess: () => {
        setRenaming(false);
        refresh();
      },
      onError: failed,
    }),
  );
  const isMine = captain !== undefined && side === mySide;

  function saveTeamName() {
    const name = teamName.trim();
    if (!name || name === captain?.teamName) {
      setRenaming(false);
      return;
    }
    rename.mutate({ id: room.id, teamName: name });
  }

  async function copyInviteLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success(t("lobby.linkCopied"));
    } catch {
      toast.error(t("lobby.linkCopyFailed"));
    }
  }

  return (
    <div className="space-y-3 border-b pb-6">
      {renaming ? (
        <div className="flex gap-2">
          <Input
            value={teamName}
            maxLength={100}
            autoFocus
            onChange={(event) => setTeamName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") saveTeamName();
              if (event.key === "Escape") setRenaming(false);
            }}
            aria-label={t("lobby.teamName")}
          />
          <Button
            disabled={!teamName.trim() || rename.isPending}
            onClick={saveTeamName}
          >
            {t("lobby.saveName")}
          </Button>
          <Button variant="ghost" onClick={() => setRenaming(false)}>
            {t("lobby.cancelEdit")}
          </Button>
        </div>
      ) : (
        <h2 className="truncate text-xl font-semibold uppercase tracking-[-0.02em] sm:text-2xl">
          {captain?.teamName ?? t(`room.team${side}`)}
        </h2>
      )}
      {captain ? (
        <>
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <Icons.Captain className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{captain.profileNickname}</span>
          </p>
          <div className="flex items-baseline gap-4">
            <span
              className={cn("label-caps", captain.ready && "text-foreground")}
            >
              {captain.ready ? t("lobby.ready") : t("lobby.notReady")}
            </span>
            {isMine && !renaming && (
              <button
                type="button"
                onClick={() => {
                  setTeamName(captain.teamName);
                  setRenaming(true);
                }}
                className="label-caps underline-offset-4 hover:text-foreground hover:underline"
              >
                {t("lobby.rename")}
              </button>
            )}
            {side === "B" && (canLeave || canRemoveCaptain) && (
              <button
                type="button"
                disabled={leave.isPending || remove.isPending}
                onClick={() =>
                  canLeave
                    ? leave.mutate({ id: room.id })
                    : remove.mutate({ id: room.id })
                }
                className="label-caps underline-offset-4 hover:text-foreground hover:underline"
              >
                {canLeave ? t("lobby.leave") : t("lobby.remove")}
              </button>
            )}
          </div>
        </>
      ) : mySide === null && room.status === "waiting" ? (
        <JoinCaptain room={room} refresh={refresh} />
      ) : (
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {mySide === "A"
              ? t("lobby.waitingForCaptain")
              : t("lobby.openSlot")}
          </span>
          {mySide === "A" && (
            <Button size="sm" onClick={copyInviteLink}>
              <Icons.Copy className="size-4" />
              {t("lobby.copyLink")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function JoinCaptain({
  room,
  refresh,
}: {
  room: AuctionRoomSnapshot;
  refresh: () => void;
}) {
  const t = useScopedI18n("dashboard.pages.auctions");
  const trpc = useTRPC();
  const { profile, openSignInDialog } = useUser();
  const queryClient = useQueryClient();
  const join = useMutation(
    trpc.auctions.joinCaptain.mutationOptions({
      onSuccess: () => {
        refresh();
        // joining may also release the viewer's previous lobby
        void queryClient.invalidateQueries(
          trpc.auctions.listActive.queryOptions(),
        );
      },
      onError: (error) => {
        toast.error(error.message);
        refresh();
      },
    }),
  );

  return (
    <Button
      className="self-start"
      disabled={join.isPending}
      onClick={() =>
        profile
          ? join.mutate({ id: room.id, teamName: t("room.teamB") })
          : openSignInDialog()
      }
    >
      {t("actions.join")}
    </Button>
  );
}

export function AuctionRoom({ id }: { id: string }) {
  const t = useScopedI18n("dashboard.pages.auctions");
  const trpc = useTRPC();
  const query = useQuery(trpc.auctions.getRoom.queryOptions({ id }));
  const refresh = useCallback(() => {
    void query.refetch();
  }, [query.refetch]);
  const connection = useAuctionRealtime(`auction:room:${id}`, refresh);
  const queryClient = useQueryClient();
  const router = useRouter();
  const cancel = useMutation(
    trpc.auctions.cancel.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.auctions.listActive.queryOptions(),
        );
        router.push("/auctions");
      },
      onError: (error) => toast.error(error.message),
    }),
  );
  const room = query.data;

  if (query.isLoading) return <AuctionRoomSkeleton />;
  if (!room || query.isError)
    return (
      <div className="mx-auto max-w-xl p-6 text-center">
        <h1 className="text-xl font-semibold">{t("room.notFound")}</h1>
        <Button
          className="mt-4"
          variant="outline"
          onClick={() => query.refetch()}
        >
          {t("actions.retry")}
        </Button>
      </div>
    );
  if (room.status === "cancelled" || room.status === "expired")
    return (
      <div className="mx-auto max-w-xl p-6">
        <Card>
          <CardContent className="py-16 text-center">
            <Icons.Auction className="mx-auto mb-4 size-10 text-muted-foreground" />
            <h1 className="text-xl font-semibold">
              {t(`terminal.${room.status}Title`)}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {t(`terminal.${room.status}Description`)}
            </p>
          </CardContent>
        </Card>
      </div>
    );

  const teamA = captainFor(room, "A");
  const teamB = captainFor(room, "B");
  return (
    <PageShell>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-4">
            <span className="label-caps text-foreground">
              {t(`status.${room.status}`)}
            </span>
            <ConnectionBadge state={connection} />
          </div>
          <h1 className="mt-2 truncate text-2xl font-semibold uppercase tracking-[-0.03em] sm:text-4xl">
            {teamA?.teamName ?? t("room.teamA")}{" "}
            <span className="text-muted-foreground">vs</span>{" "}
            {teamB?.teamName ?? t("room.teamB")}
          </h1>
        </div>
        {room.permissions.canCancel && (
          <Button
            variant="outline"
            disabled={cancel.isPending}
            onClick={() => cancel.mutate({ id: room.id })}
          >
            {t("actions.cancel")}
          </Button>
        )}
      </header>

      {room.status === "completed" && (
        <Card>
          <CardContent className="py-8 text-center">
            <Icons.Trophy className="mx-auto mb-3 size-10 text-muted-foreground" />
            <h2 className="text-2xl font-semibold">
              {t("terminal.completedTitle")}
            </h2>
            <p className="text-muted-foreground">
              {t("terminal.completedDescription")}
            </p>
          </CardContent>
        </Card>
      )}
      {(room.status === "waiting" || room.status === "countdown") && (
        <Lobby room={room} refresh={refresh} />
      )}

      {room.status === "active" && (
        <div className="grid gap-10 lg:grid-cols-[minmax(260px,320px)_minmax(0,1fr)_minmax(260px,320px)] lg:gap-12">
          <div className="order-2 lg:order-1">
            <TeamRoster room={room} side="A" />
          </div>
          <div className="order-1 space-y-8 lg:order-2">
            <ActiveStage room={room} refresh={refresh} />
            {room.showOrder && (
              <section>
                <h2 className="label-caps pb-2 text-foreground">
                  {t("room.upcoming")}
                </h2>
                <ol className="num flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  {room.players
                    .filter(
                      (p) =>
                        p.drawPosition != null &&
                        !p.teamSide &&
                        p.id !== room.currentPlayerId,
                    )
                    .sort(
                      (a, b) => (a.drawPosition ?? 0) - (b.drawPosition ?? 0),
                    )
                    .map((p) => (
                      <li key={p.id}>{p.gameName}</li>
                    ))}
                </ol>
              </section>
            )}
          </div>
          <div className="order-3 space-y-10">
            <TeamRoster room={room} side="B" />
            <EventFeed room={room} />
          </div>
        </div>
      )}

      {room.status === "completed" && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_360px]">
          <TeamRoster room={room} side="A" />
          <TeamRoster room={room} side="B" />
          <EventFeed room={room} />
        </div>
      )}
    </PageShell>
  );
}

export function AuctionRoomSkeleton() {
  return (
    <PageShell>
      <div className="border-b pb-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="mt-2 h-8 w-2/3 sm:h-10" />
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(260px,320px)_minmax(0,1fr)_minmax(260px,320px)] lg:gap-12">
        <Skeleton className="order-2 h-80 lg:order-1" />
        <div className="order-1 space-y-8 lg:order-2">
          <div className="space-y-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-12 w-2/3" />
            <Skeleton className="h-28 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
        <Skeleton className="order-3 h-80" />
      </div>
    </PageShell>
  );
}
