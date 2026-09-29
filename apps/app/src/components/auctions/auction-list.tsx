"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@v1/ui/button";
import { cn } from "@v1/ui/cn";
import { AuctionListSkeleton } from "@v1/ui/recipes/auctions/auction-list-skeleton";
import { ConnectionBadge } from "@v1/ui/recipes/auctions/connection-badge";
import { Icons } from "@v1/ui/recipes/icons";
import { PageHeader } from "@v1/ui/recipes/page-header";
import { PageShell } from "@v1/ui/recipes/page-shell";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useUser } from "@/components/auth/user-context";
import { useScopedI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/react";
import { useAuctionRealtime } from "./use-auction-realtime";

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
    <PageShell>
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
                  {room.isMine && (
                    <span className="label-caps bg-foreground px-1.5 text-background">
                      {t("list.yours")}
                    </span>
                  )}
                </div>

                <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                  <div className="min-w-0 space-y-2">
                    <h2 className="text-3xl font-semibold uppercase leading-[0.95] tracking-[-0.03em] sm:text-5xl">
                      {room.teamA.teamName}
                      <span className="text-muted-foreground">
                        {" "}
                        {t("room.versus")}{" "}
                      </span>
                      {room.teamB.teamName}
                    </h2>
                    <p className="truncate text-xs text-muted-foreground">
                      {[room.teamA.captain, room.teamB.captain]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>

                  <div className="flex items-end gap-8 sm:justify-end">
                    {room.status === "waiting" ? (
                      <p className="text-sm font-medium">
                        {room.teamB.captain
                          ? t("list.waitingReady")
                          : t("list.lookingForCaptain")}
                      </p>
                    ) : (
                      <>
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
                      </>
                    )}
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
        <div className="flex flex-col items-start gap-4">
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
    </PageShell>
  );
}
