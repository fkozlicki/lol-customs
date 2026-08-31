"use client";

import { createClient } from "@v1/supabase/client";
import { useEffect, useState } from "react";

export type RealtimeState = "connecting" | "live" | "degraded";

export function useAuctionRealtime(topic: string, refresh: () => void) {
  const [state, setState] = useState<RealtimeState>("connecting");

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let disposed = false;

    async function subscribe(accessToken?: string) {
      if (channel) await supabase.removeChannel(channel);
      if (disposed) return;

      setState("connecting");
      if (accessToken) supabase.realtime.setAuth(accessToken);

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
    }

    supabase.auth.getSession().then(({ data }) => {
      void subscribe(data.session?.access_token);
    });
    const { data: authSubscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        void subscribe(session?.access_token);
      },
    );

    return () => {
      disposed = true;
      authSubscription.subscription.unsubscribe();
      if (channel) void supabase.removeChannel(channel);
    };
  }, [refresh, topic]);

  useEffect(() => {
    if (state !== "degraded") return;
    const interval = window.setInterval(refresh, 2000);
    return () => window.clearInterval(interval);
  }, [refresh, state]);

  return state;
}
