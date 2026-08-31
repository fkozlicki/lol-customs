"use client";

import { useQuery } from "@tanstack/react-query";
import { Badge } from "@v1/ui/badge";
import { Button } from "@v1/ui/button";
import { Card, CardContent } from "@v1/ui/card";
import { Icons } from "@v1/ui/icons";
import { Skeleton } from "@v1/ui/skeleton";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useUser } from "@/components/auth/user-context";
import { useScopedI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/react";
import { riotId } from "./auction-contract";
import { useAuctionRealtime } from "./use-auction-realtime";

function ConnectionBadge({
  state,
}: {
  state: "connecting" | "live" | "degraded";
}) {
  const t = useScopedI18n("dashboard.pages.auctions");
  return (
    <Badge
      variant="outline"
      className={
        state === "live"
          ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
          : state === "degraded"
            ? "border-amber-500/40 text-amber-600 dark:text-amber-400"
            : "text-muted-foreground"
      }
    >
      <span
        className={`size-1.5 rounded-full ${state === "live" ? "bg-emerald-500" : state === "degraded" ? "bg-amber-500" : "animate-pulse bg-muted-foreground"}`}
      />
      {t(`connection.${state}`)}
    </Badge>
  );
}

export function AuctionList() {
  const t = useScopedI18n("dashboard.pages.auctions");
  const trpc = useTRPC();
  const router = useRouter();
  const { profile, isLoading: userLoading, openSignInDialog } = useUser();
  const query = useQuery(trpc.auctions.listActive.queryOptions());
  const refresh = useCallback(() => {
    void query.refetch();
  }, [query.refetch]);
  const connection = useAuctionRealtime("auction:list", refresh);

  function createAuction() {
    if (!profile) {
      openSignInDialog();
      return;
    }
    router.push("/auctions/new");
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {t("title")}
            </h1>
            <ConnectionBadge state={connection} />
          </div>
          <p className="max-w-2xl text-muted-foreground">{t("description")}</p>
        </div>
        <Button size="lg" onClick={createAuction} disabled={userLoading}>
          <Icons.Auction className="size-4" />
          {t("list.create")}
        </Button>
      </div>

      {query.isLoading ? (
        <AuctionListSkeleton />
      ) : query.isError ? (
        <Card className="border-destructive/30">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="font-medium">{t("errors.load")}</p>
            <Button variant="outline" onClick={() => query.refetch()}>
              {t("actions.retry")}
            </Button>
          </CardContent>
        </Card>
      ) : query.data?.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {query.data.map((room) => (
            <Link key={room.id} href={`/auctions/${room.id}`} className="group">
              <Card className="relative h-full overflow-hidden border-border/70 transition-all group-hover:-translate-y-0.5 group-hover:border-amber-500/40 group-hover:shadow-lg">
                <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-amber-300 via-amber-500 to-orange-600" />
                <CardContent className="space-y-5 p-5 pl-6">
                  <div className="flex items-center justify-between gap-3">
                    <Badge
                      variant={
                        room.status === "active" ? "default" : "secondary"
                      }
                      className={
                        room.status === "active"
                          ? "bg-amber-500 text-black"
                          : ""
                      }
                    >
                      {room.status === "active" && (
                        <span className="size-1.5 animate-pulse rounded-full bg-black" />
                      )}
                      {t(`status.${room.status}`)}
                    </Badge>
                    <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      {t("list.watch")}
                    </span>
                  </div>

                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-lg font-bold">
                        {room.teamA.teamName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {riotId(room.teamA)}
                      </p>
                    </div>
                    <span className="font-mono text-xs font-black text-amber-500">
                      VS
                    </span>
                    <div className="min-w-0 text-right">
                      <p className="truncate text-lg font-bold">
                        {room.teamB.teamName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {riotId(room.teamB)}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border bg-muted/30 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {t("list.onStage")}
                    </p>
                    <div className="mt-1 flex items-end justify-between gap-3">
                      <p className="truncate font-semibold">
                        {room.currentPlayer
                          ? riotId(room.currentPlayer)
                          : t("list.starting")}
                      </p>
                      <p className="shrink-0 font-mono text-2xl font-black text-amber-500">
                        ${room.currentBid ?? 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden border-dashed">
          <CardContent className="relative flex flex-col items-center px-6 py-16 text-center">
            <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
              <Icons.Auction className="size-7" />
            </div>
            <h2 className="text-lg font-semibold">{t("list.emptyTitle")}</h2>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              {t("list.emptyDescription")}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function AuctionListSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {[0, 1, 2, 3].map((item) => (
        <Skeleton key={item} className="h-56 rounded-xl" />
      ))}
    </div>
  );
}

export { ConnectionBadge };
