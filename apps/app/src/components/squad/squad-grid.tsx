"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { PlayerSquadCard } from "@/components/squad/player-squad-card";
import { useTRPC } from "@/trpc/react";

export function SquadGrid() {
  const trpc = useTRPC();
  const { data: players } = useSuspenseQuery(
    trpc.duos.duosPerPlayer.queryOptions({ partnerLimit: 3 }),
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {players.map((entry) => (
        <PlayerSquadCard key={entry.puuid} entry={entry} />
      ))}
    </div>
  );
}

export function SquadGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="rounded-lg border bg-card p-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="bg-muted size-12 rounded-lg" />
            <div className="bg-muted h-5 w-32 rounded" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((j) => (
              <div key={j} className="space-y-2">
                <div className="bg-muted h-3 w-24 rounded" />
                <div className="bg-muted h-8 w-full rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
