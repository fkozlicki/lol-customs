"use client";

import { useQuery } from "@tanstack/react-query";
import { AuctionListPage } from "@v1/ui/recipes/auctions/auction-list-page";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useUser } from "@/components/auth/user-context";
import { useTRPC } from "@/trpc/react";
import { toAuctionSummaryView } from "./auction-list-view";
import { useAuctionRealtime } from "./use-auction-realtime";

/** The live list of auctions, refreshed over realtime; creating one asks a visitor to sign in first. */
export function AuctionList() {
  const trpc = useTRPC();
  const router = useRouter();
  const { profile, isLoading: userLoading, openSignInDialog } = useUser();
  const query = useQuery(trpc.auctions.listActive.queryOptions());
  const refresh = useCallback(() => {
    void query.refetch();
  }, [query.refetch]);
  const connection = useAuctionRealtime("auction:list", refresh);

  return (
    <AuctionListPage
      state={query.isLoading ? "loading" : query.isError ? "error" : "ready"}
      auctions={(query.data ?? []).map(toAuctionSummaryView)}
      connection={connection}
      onCreate={() =>
        profile ? router.push("/auctions/new") : openSignInDialog()
      }
      createDisabled={userLoading}
      onRetry={refresh}
    />
  );
}
