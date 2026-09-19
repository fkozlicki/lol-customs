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
        <ul className="divide-y border-y">
          {query.data.map((room) => (
            <li key={room.id}>
              <Link
                href={`/auctions/${room.id}`}
                className="group grid gap-4 py-5 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div className="min-w-0 space-y-2">
                  <span className="label-caps">
                    {t(`status.${room.status}`)}
                  </span>
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-xl font-semibold underline-offset-4 group-hover:underline sm:text-2xl">
                      {room.teamA.teamName}
                    </span>
                    <span className="label-caps">vs</span>
                    <span className="text-xl font-semibold underline-offset-4 group-hover:underline sm:text-2xl">
                      {room.teamB.teamName}
                    </span>
                  </div>
                  <p className="num truncate text-xs text-muted-foreground">
                    {riotId(room.teamA)} · {riotId(room.teamB)}
                  </p>
                </div>

                <div className="flex items-center gap-6 sm:justify-end">
                  <div className="flex flex-col sm:items-end">
                    <span className="label-caps">{t("list.onStage")}</span>
                    <span className="truncate text-sm font-medium">
                      {room.currentPlayer
                        ? riotId(room.currentPlayer)
                        : t("list.starting")}
                    </span>
                  </div>
                  <span className="num text-2xl font-semibold">
                    ${room.currentBid ?? 0}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-start gap-2 py-10">
          <p className="text-xl font-semibold tracking-[-0.02em]">
            {t("list.emptyTitle")}
          </p>
          <p className="max-w-md text-sm text-muted-foreground">
            {t("list.emptyDescription")}
          </p>
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
