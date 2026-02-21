"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@v1/ui/card";
import { useCallback, useState } from "react";
import { useScopedI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/react";
import MatchHistoryCard from "./match-history-card";

interface MatchHistoryListProps {
  limit?: number;
}

export function MatchHistoryList({ limit = 50 }: MatchHistoryListProps) {
  const t = useScopedI18n("dashboard.pages.matchHistory");
  const trpc = useTRPC();
  const [expandedMatchId, setExpandedMatchId] = useState<number | null>(null);

  const { data: matchesData } = useSuspenseQuery(
    trpc.matches.list.queryOptions({ limit }),
  );
  const { data: patch } = useSuspenseQuery(
    trpc.datadragon.currentPatch.queryOptions(),
  );
  const { data: championMap } = useSuspenseQuery(
    trpc.datadragon.championMap.queryOptions(),
  );

  const toggleExpand = useCallback((matchId: number) => {
    setExpandedMatchId((prev) => (prev === matchId ? null : matchId));
  }, []);

  if (!matchesData?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("emptyTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">{t("noMatchesYet")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {matchesData.map((match) => (
        <MatchHistoryCard
          key={match.match_id}
          match={match}
          patch={patch ?? ""}
          championMap={championMap ?? {}}
          expandedMatchId={expandedMatchId}
          toggleExpand={toggleExpand}
        />
      ))}
    </div>
  );
}
