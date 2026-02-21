"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@v1/ui/card";
import HallOfFameCard from "@/components/hof/hall-of-fame-card";
import { HOF_TITLES } from "@/components/hof/hof-config";
import { useTRPC } from "@/trpc/react";

export function HofGrid() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.riftRank.hofLeaders.queryOptions(),
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {HOF_TITLES.map(({ id, valueFormat }) => (
        <HallOfFameCard
          key={id}
          titleId={id}
          valueFormat={valueFormat}
          leader={data[id] ?? null}
        />
      ))}
    </div>
  );
}

export function HofGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {HOF_TITLES.slice(0, 6).map((entry) => (
        <Card key={entry.id}>
          <CardHeader className="space-y-0">
            <div className="bg-muted h-5 w-24 rounded" />
            <div className="bg-muted h-4 w-full rounded" />
          </CardHeader>
          <CardContent>
            <div className="bg-muted h-5 w-32 rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
