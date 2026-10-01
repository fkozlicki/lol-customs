"use client";

import { type QueryKey, useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { type RealtimeState, useAuctionRealtime } from "./use-auction-realtime";

interface AuctionLiveValue {
  /** How the page keeps up: live over realtime, polling, or still connecting. */
  connection: RealtimeState;
  /** Reads the kept query again now. */
  refresh: () => void;
}

const AuctionLiveContext = createContext<AuctionLiveValue | null>(null);

/** The connection and the refresh of the nearest `AuctionLive`. */
export function useAuctionLive() {
  const ctx = useContext(AuctionLiveContext);
  if (!ctx) throw new Error("useAuctionLive must be used within AuctionLive");
  return ctx;
}

interface AuctionLiveProps {
  /** The realtime channel whose broadcasts mean the data moved, e.g. `auction:list`. */
  topic: string;
  /** The query kept fresh: invalidated on every broadcast, and every two seconds while polling. */
  queryKey: QueryKey;
  children: React.ReactNode;
}

/**
 * Keeps one query current over a realtime channel, for everything on the page: the badge reads the
 * connection, the list just reads its query.
 */
export function AuctionLive({ topic, queryKey, children }: AuctionLiveProps) {
  const queryClient = useQueryClient();
  // Read through a ref, so a new array from the server does not resubscribe the channel.
  const queryKeyRef = useRef(queryKey);
  useEffect(() => {
    queryKeyRef.current = queryKey;
  });
  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: queryKeyRef.current });
  }, [queryClient]);
  const connection = useAuctionRealtime(topic, refresh);
  const value = useMemo(() => ({ connection, refresh }), [connection, refresh]);

  return (
    <AuctionLiveContext.Provider value={value}>
      {children}
    </AuctionLiveContext.Provider>
  );
}
