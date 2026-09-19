"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Badge } from "@v1/ui/badge";
import { Button } from "@v1/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@v1/ui/card";
import { Icons } from "@v1/ui/icons";
import { Input } from "@v1/ui/input";
import { Label } from "@v1/ui/label";
import { Skeleton } from "@v1/ui/skeleton";
import { toast } from "@v1/ui/sonner";
import { useCallback, useEffect, useState } from "react";
import { useUser } from "@/components/auth/user-context";
import { useScopedI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/react";
import {
  type AuctionEvent,
  type AuctionRoomSnapshot,
  type AuctionSide,
  captainFor,
  playersFor,
  riotId,
} from "./auction-contract";
import { AuctionCountdown } from "./auction-countdown";
import { ConnectionBadge } from "./auction-list";
import { AuctionRank, AuctionSetupForm } from "./auction-setup-form";
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
  const slots = Array.from({ length: 5 }, (_, index) => players[index] ?? null);

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
        {slots.map((player, index) => (
          <li
            key={player?.id ?? `empty-${side}-${index}`}
            className="flex h-14 items-center gap-3"
          >
            <span className="num w-4 shrink-0 text-xs text-muted-foreground">
              {index + 1}
            </span>
            {player ? (
              <>
                <div className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 truncate text-sm font-medium">
                    {player.gameName}
                    {captain?.playerId === player.id && (
                      <Icons.Captain className="size-3.5 shrink-0 text-muted-foreground" />
                    )}
                  </span>
                  <AuctionRank
                    tier={player.soloTier}
                    label={player.soloRankLabel}
                  />
                </div>
                {captain?.playerId !== player.id &&
                  player.purchasePrice != null && (
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
    if (event.type === "pass") return t("feed.pass", { team });
    if (event.type === "pass_skipped")
      return t("feed.passSkipped", { team, player: name });
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
  const trpc = useTRPC();
  const current = room.players.find(
    (player) => player.id === room.currentPlayerId,
  );
  const mySide = room.permissions.mySide;
  const myCaptain = mySide ? captainFor(room, mySide) : undefined;
  const opponentSide = mySide === "A" ? "B" : "A";
  const opponentCaptain = mySide ? captainFor(room, opponentSide) : undefined;
  const myBudget = myCaptain?.budgetRemaining ?? 0;
  const opponentBudget = opponentCaptain?.budgetRemaining ?? 0;
  const minimumBid = (room.currentBid ?? 0) + 1;
  // passive rule: against a broke opponent the active side may only bid "$1 over"
  const maxBid = opponentBudget === 0 ? minimumBid : myBudget;
  const allIn = myBudget;
  const [amount, setAmount] = useState(minimumBid);
  // keep a legally-entered higher bid instead of snapping back to the minimum
  useEffect(() => {
    setAmount((current) =>
      current < minimumBid ? minimumBid : Math.min(current, maxBid),
    );
  }, [minimumBid, maxBid]);
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
  const canBid =
    room.permissions.canBid &&
    room.currentLeaderSide !== mySide &&
    myBudget >= minimumBid;
  const canPass = room.permissions.canPass;
  const opponentIsBroke = opponentBudget === 0;
  const iAmBroke = myBudget === 0;
  const moneyDecision =
    room.phase === "awaiting_opening_bid" && opponentIsBroke && !iAmBroke;
  const passLabel =
    room.phase === "awaiting_opening_bid"
      ? t("actions.passOpening")
      : t("actions.pass");
  const passHint =
    room.phase === "awaiting_opening_bid"
      ? t("room.passOpeningHint")
      : t("room.passHint");
  const isOpening = room.phase === "awaiting_opening_bid";
  const myPassFlag = mySide ? (mySide === "A" ? "a" : "b") : null;
  const opponentPassFlag = mySide === "A" ? "b" : mySide === "B" ? "a" : null;
  const myPassed = myPassFlag ? room.openingPass[myPassFlag] : false;
  const opponentPassed = opponentPassFlag
    ? room.openingPass[opponentPassFlag]
    : false;

  return (
    <section className="flex min-h-[26rem] flex-col justify-between gap-8 border-b pb-8">
      <div className="flex items-start justify-between gap-4">
        <span className="label-caps text-foreground">
          {t(`phase.${room.phase ?? "awaiting_opening_bid"}`)}
        </span>
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
            <AuctionRank
              tier={current.soloTier}
              label={current.soloRankLabel}
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2 sm:items-end">
            <div>
              <p className="label-caps">{t("room.currentPrice")}</p>
              <p className="num text-6xl font-semibold leading-none sm:text-7xl">
                ${room.currentBid ?? 0}
              </p>
            </div>
            <div className="sm:text-right">
              {room.phaseEndsAt && room.phase === "bidding" ? (
                <AuctionCountdown
                  deadline={room.phaseEndsAt}
                  serverNow={room.serverNow}
                  durationSeconds={room.bidSeconds}
                />
              ) : room.phase === "awaiting_opening_bid" ? (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {t("room.waitingFirstBid")}
                  </p>
                  {opponentPassed && (
                    <p className="label-caps text-foreground">
                      {t("room.opponentPassed")}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-lg font-semibold uppercase tracking-[-0.02em]">
                  {t("room.soldPause")}
                </p>
              )}
            </div>
          </div>

          {mySide && room.phase !== "sold_pause" && (
            <div className="space-y-3 border-t pt-6">
              {isOpening && myPassed && (
                <p className="label-caps flex items-center gap-2 text-foreground">
                  <Icons.Check className="size-4" />
                  {t("room.myPassed")}
                </p>
              )}
              {moneyDecision ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button
                    size="lg"
                    disabled={!canBid || bid.isPending}
                    onClick={() =>
                      bid.mutate({ id: room.id, amount: minimumBid })
                    }
                  >
                    {t("actions.takeForOne")}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    disabled={!canPass || pass.isPending}
                    onClick={() => pass.mutate({ id: room.id })}
                  >
                    {t("actions.sendBack")}
                  </Button>
                </div>
              ) : iAmBroke ? (
                <p className="text-sm text-muted-foreground">
                  {t("room.iAmBroke")}
                </p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min={minimumBid}
                      max={maxBid}
                      value={Number.isNaN(amount) ? "" : amount}
                      onChange={(event) =>
                        setAmount(event.target.valueAsNumber)
                      }
                      aria-label={t("actions.customBid")}
                      className="num h-11 w-24 text-lg"
                    />
                    <Button
                      size="lg"
                      className="flex-1"
                      disabled={
                        !canBid ||
                        bid.isPending ||
                        amount < minimumBid ||
                        amount > maxBid
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
                      disabled={!canBid || bid.isPending || minimumBid > maxBid}
                      onClick={() =>
                        bid.mutate({ id: room.id, amount: minimumBid })
                      }
                    >
                      +1
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      disabled={
                        !canBid ||
                        bid.isPending ||
                        allIn < minimumBid ||
                        allIn > maxBid
                      }
                      onClick={() => bid.mutate({ id: room.id, amount: allIn })}
                    >
                      {t("actions.allIn")}
                    </Button>
                    <Button
                      size="lg"
                      variant="ghost"
                      disabled={!canPass || pass.isPending}
                      onClick={() => pass.mutate({ id: room.id })}
                    >
                      {passLabel}
                    </Button>
                  </div>
                </div>
              )}
              <p className="text-xs text-muted-foreground">{passHint}</p>
            </div>
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

function Lobby({
  room,
  refresh,
}: {
  room: AuctionRoomSnapshot;
  refresh: () => void;
}) {
  const t = useScopedI18n("dashboard.pages.auctions");
  const trpc = useTRPC();
  const { profile, openSignInDialog } = useUser();
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [teamName, setTeamName] = useState(
    room.permissions.mySide
      ? (captainFor(room, room.permissions.mySide)?.teamName ?? "")
      : "Team B",
  );
  const available = room.players.filter(
    (player) =>
      !room.captains.some((captain) => captain.playerId === player.id),
  );
  const failed = (error: { message: string }) => {
    toast.error(error.message);
    refresh();
  };
  const join = useMutation(
    trpc.auctions.joinCaptain.mutationOptions({
      onSuccess: refresh,
      onError: failed,
    }),
  );
  const ready = useMutation(
    trpc.auctions.setReady.mutationOptions({
      onSuccess: refresh,
      onError: failed,
    }),
  );
  const leave = useMutation(
    trpc.auctions.leaveCaptain.mutationOptions({
      onSuccess: refresh,
      onError: failed,
    }),
  );
  const remove = useMutation(
    trpc.auctions.removeCaptain.mutationOptions({
      onSuccess: refresh,
      onError: failed,
    }),
  );
  const update = useMutation(
    trpc.auctions.updateLobby.mutationOptions({
      onSuccess: refresh,
      onError: failed,
    }),
  );
  const me = room.permissions.mySide
    ? captainFor(room, room.permissions.mySide)
    : undefined;

  async function copyInviteLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success(t("lobby.linkCopied"));
    } catch {
      toast.error(t("lobby.linkCopyFailed"));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {room.status === "countdown" ? t("lobby.starting") : t("lobby.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-y py-3">
          <p className="text-sm text-muted-foreground">{t("lobby.invite")}</p>
          <Button variant="outline" size="sm" onClick={copyInviteLink}>
            <Icons.Copy className="size-4" />
            {t("lobby.copyLink")}
          </Button>
        </div>
        {room.countdownEndsAt && (
          <AuctionCountdown
            deadline={room.countdownEndsAt}
            serverNow={room.serverNow}
            durationSeconds={5}
          />
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          {(["A", "B"] as const).map((side) => {
            const captain = captainFor(room, side);
            return (
              <div key={side} className="border p-4">
                <div className="flex justify-between gap-2">
                  <div>
                    <p className="font-semibold">
                      {captain?.teamName ?? t(`room.team${side}`)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {captain
                        ? riotId(
                            room.players.find(
                              (p) => p.id === captain.playerId,
                            )!,
                          )
                        : t("lobby.openSlot")}
                    </p>
                  </div>
                  {captain && (
                    <Badge variant={captain.ready ? "default" : "secondary"}>
                      {captain.ready ? t("lobby.ready") : t("lobby.notReady")}
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {room.permissions.canJoin && (
          <div className="space-y-3 border p-4">
            <h3 className="font-semibold">{t("lobby.joinTitle")}</h3>
            <Label>{t("lobby.chooseYourself")}</Label>
            <div className="grid max-h-48 gap-2 overflow-y-auto sm:grid-cols-2">
              {available.map((player) => (
                <button
                  type="button"
                  key={player.id}
                  onClick={() => setSelectedPlayer(player.id)}
                  className={`border p-2 text-left text-sm ${selectedPlayer === player.id ? "bg-foreground text-background" : ""}`}
                >
                  {riotId(player)}
                </button>
              ))}
            </div>
            <Input
              value={teamName}
              maxLength={100}
              onChange={(event) => setTeamName(event.target.value)}
              placeholder={t("lobby.teamName")}
            />
            <Button
              disabled={!selectedPlayer || !teamName.trim() || join.isPending}
              onClick={() =>
                profile
                  ? join.mutate({
                      id: room.id,
                      playerId: selectedPlayer,
                      teamName,
                    })
                  : openSignInDialog()
              }
            >
              {t("actions.join")}
            </Button>
          </div>
        )}
        {me && (
          <div className="space-y-3  border bg-muted/20 p-4">
            <Label>{t("lobby.teamName")}</Label>
            <div className="flex gap-2">
              <Input
                value={teamName}
                maxLength={100}
                onChange={(event) => setTeamName(event.target.value)}
                placeholder={me.teamName || t("lobby.teamName")}
              />
              <Button
                variant="outline"
                disabled={!teamName.trim() || update.isPending}
                onClick={() => update.mutate({ id: room.id, teamName })}
              >
                {t("actions.saveTeamName")}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={!room.permissions.canReady || ready.isPending}
                onClick={() => ready.mutate({ id: room.id, ready: !me.ready })}
              >
                {me.ready ? t("actions.unready") : t("actions.ready")}
              </Button>
              {room.permissions.canLeave && (
                <Button
                  variant="outline"
                  onClick={() => leave.mutate({ id: room.id })}
                >
                  {t("actions.leave")}
                </Button>
              )}
              {room.permissions.canRemoveCaptain && captainFor(room, "B") && (
                <Button
                  variant="outline"
                  onClick={() => remove.mutate({ id: room.id })}
                >
                  {t("actions.removeCaptain")}
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
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
  const cancel = useMutation(
    trpc.auctions.cancel.mutationOptions({
      onSuccess: refresh,
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
    <div className="mx-auto w-full max-w-[1500px] space-y-10 px-4 pt-10 pb-16 sm:pt-16">
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

      {(room.status === "waiting" || room.status === "countdown") && (
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div>
            {room.permissions.canEditLobby && (
              <details className="border p-4">
                <summary className="cursor-pointer font-semibold">
                  {t("lobby.edit")}
                </summary>
                <div className="mt-5">
                  <AuctionSetupForm
                    roomId={room.id}
                    initialPlayers={room.players.map((player) => ({
                      key: player.id,
                      gameName: player.gameName,
                      tagLine: player.tagLine,
                      platformId: player.platformId,
                    }))}
                    initialCaptainKey={captainFor(room, "A")?.playerId}
                    initialTeamName={captainFor(room, "A")?.teamName}
                    initialBudget={room.budget}
                    initialBidSeconds={room.bidSeconds}
                    initialRevealOrder={room.showOrder}
                    lockedPlayerKeys={room.captains.map(
                      (captain) => captain.playerId,
                    )}
                    onUpdated={refresh}
                  />
                </div>
              </details>
            )}
          </div>
          <EventFeed room={room} />
        </div>
      )}
    </div>
  );
}

export function AuctionRoomSkeleton() {
  return (
    <div className="mx-auto max-w-[1500px] space-y-4 p-4">
      <Skeleton className="h-24 " />
      <div className="grid gap-4 lg:grid-cols-[280px_1fr_280px]">
        <Skeleton className="h-96 " />
        <Skeleton className="h-[520px] " />
        <Skeleton className="h-96 " />
      </div>
    </div>
  );
}
