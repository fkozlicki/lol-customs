"use client";

import { createClient } from "@v1/supabase/client";
import { useEffect, useState } from "react";

export type RealtimeState = "connecting" | "live" | "degraded";

type Channel = ReturnType<ReturnType<typeof createClient>["channel"]>;

/**
 * Channels still being left, by topic. Supabase hands back the existing channel for a topic until the
 * server confirms the leave, so a new subscription to the same topic waits for it rather than getting
 * the channel that is going away.
 */
const leaving = new Map<string, Promise<unknown>>();

/**
 * Listens to an auction topic and calls `refresh` on every broadcast. Supabase passes the session's
 * token to Realtime on its own, and both topics are open to visitors and signed-in users alike, so the
 * channel is joined once per topic and kept through sign-in. Until it is live, `refresh` runs every
 * 2 seconds.
 */
export function useAuctionRealtime(topic: string, refresh: () => void) {
  const [state, setState] = useState<RealtimeState>("connecting");

  useEffect(() => {
    const supabase = createClient();
    let channel: Channel | null = null;
    let disposed = false;

    setState("connecting");
    void (leaving.get(topic) ?? Promise.resolve()).then(() => {
      if (disposed) return;
      channel = supabase
        .channel(topic, { config: { private: true } })
        .on("broadcast", { event: "*" }, refresh)
        .subscribe((status) => {
          if (disposed) return;
          if (status === "SUBSCRIBED") {
            setState("live");
            refresh();
          } else if (
            status === "CHANNEL_ERROR" ||
            status === "TIMED_OUT" ||
            status === "CLOSED"
          ) {
            setState("degraded");
          }
        });
    });

    return () => {
      disposed = true;
      if (!channel) return;
      // Leave the channel but keep the socket: removing the last channel would start a disconnect
      // that the next subscription cannot reconnect through.
      const left: Promise<unknown> = channel.unsubscribe().finally(() => {
        if (leaving.get(topic) === left) leaving.delete(topic);
      });
      leaving.set(topic, left);
    };
  }, [refresh, topic]);

  useEffect(() => {
    if (state === "live") return;
    const interval = window.setInterval(refresh, 2000);
    return () => window.clearInterval(interval);
  }, [refresh, state]);

  return state;
}
