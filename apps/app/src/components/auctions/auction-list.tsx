"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@v1/ui/button";
import { cn } from "@v1/ui/cn";
import { Icons } from "@v1/ui/icons";
import { Skeleton } from "@v1/ui/skeleton";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useUser } from "@/components/auth/user-context";
import { PageHeader } from "@/components/page-header";
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
    <span className="flex items-center gap-1.5">
      <span
        className={cn(
          "size-1.5",
          state === "live" ? "bg-foreground" : "bg-muted-foreground",
          state === "connecting" && "animate-pulse",
        )}
      />
      <span className="label-caps">{t(`connection.${state}`)}</span>
    </span>
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
    <div className="mx-auto w-full max-w-5xl space-y-10 px-4 pt-10 pb-16 sm:pt-16">
      <PageHeader title={t("title")} description={t("description")}>
        <div className="flex items-center gap-4">
          <ConnectionBadge state={connection} />
          <Button onClick={createAuction} disabled={userLoading}>
            <Icons.Auction className="size-4" />
            {t("list.create")}
          </Button>
        </div>
      </PageHeader>

      {query.isLoading ? (
        <AuctionListSkeleton />
      ) : query.isError ? (
        <div className="flex flex-col items-start gap-4 py-10">
          <p className="text-sm text-muted-foreground">{t("errors.load")}</p>
          <Button variant="outline" onClick={() => query.refetch()}>
            {t("actions.retry")}
          </Button>
        </div>
      ) : query.data?.length ? (
        <ul className="space-y-12">
          {query.data.map((room) => (
            <li key={room.id}>
              <Link href={`/auctions/${room.id}`} className="group block">
                <div className="flex items-center gap-3 pb-4">
                  <span
                    className={cn(
                      "size-1.5",
                      room.status === "active"
                        ? "animate-pulse bg-foreground"
                        : "bg-muted-foreground",
                    )}
                  />
                  <span className="label-caps text-foreground">
                    {t(`status.${room.status}`)}
                  </span>
                </div>

                <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                  <div className="min-w-0 space-y-2">
                    <h2 className="text-3xl font-semibold uppercase leading-[0.95] tracking-[-0.03em] sm:text-5xl">
                      {room.teamA.teamName}
                      <span className="text-muted-foreground"> vs </span>
                      {room.teamB.teamName}
                    </h2>
                    <p className="num truncate text-xs text-muted-foreground">
                      {riotId(room.teamA)} · {riotId(room.teamB)}
                    </p>
                  </div>

                  <div className="flex items-end gap-8 sm:justify-end">
                    <div className="min-w-0">
                      <p className="label-caps">{t("list.onStage")}</p>
                      <p className="truncate text-sm font-medium">
                        {room.currentPlayer
                          ? room.currentPlayer.gameName
                          : t("list.starting")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="label-caps">{t("list.price")}</p>
                      <p className="num text-4xl font-semibold leading-none">
                        ${room.currentBid ?? 0}
                      </p>
                    </div>
                    <span className="label-caps hidden text-foreground underline-offset-4 group-hover:underline sm:block">
                      {t("list.watch")} →
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-start gap-4 border-t pt-10">
          <p className="text-2xl font-semibold uppercase tracking-[-0.03em] sm:text-3xl">
            {t("list.emptyTitle")}
          </p>
          <p className="max-w-md text-sm text-muted-foreground">
            {t("list.emptyDescription")}
          </p>
          <Button
            variant="outline"
            onClick={createAuction}
            disabled={userLoading}
          >
            <Icons.Auction className="size-4" />
            {t("list.create")}
          </Button>
        </div>
      )}
    </div>
  );
}

export function AuctionListSkeleton() {
  return (
    <div className="space-y-px">
      {[0, 1, 2].map((item) => (
        <Skeleton key={item} className="h-24 w-full" />
      ))}
    </div>
  );
}

export { ConnectionBadge };
