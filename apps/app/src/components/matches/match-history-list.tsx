"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import type { RouterOutputs } from "@v1/api";
import { Card, CardContent, CardHeader, CardTitle } from "@v1/ui/card";
import { useCallback, useState } from "react";
import { useScopedI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/react";
import { MatchCard } from "./match-card";
import { MatchDetail } from "./match-detail";

type MatchWithParticipants =
  RouterOutputs["matches"]["recentWithParticipants"][number];

interface MatchHistoryListProps {
  limit?: number;
}

export function MatchHistoryList({ limit = 50 }: MatchHistoryListProps) {
  const t = useScopedI18n("dashboard.pages.matchHistory");
  const trpc = useTRPC();
  const [expandedMatchId, setExpandedMatchId] = useState<number | null>(null);

  const { data: matchesData } = useSuspenseQuery(
    trpc.matches.recentWithParticipants.queryOptions({ limit }),
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
      {matchesData.map((entry: MatchWithParticipants) => (
        <div key={entry.match.match_id} className="space-y-1">
          <MatchCard
            entry={entry}
            patch={patch ?? ""}
            championMap={championMap ?? {}}
            isExpanded={expandedMatchId === entry.match.match_id}
            onToggleExpand={() => toggleExpand(entry.match.match_id)}
          />
          {expandedMatchId === entry.match.match_id && (
            <MatchDetail
              entry={entry}
              patch={patch ?? ""}
              championMap={championMap ?? {}}
            />
          )}
        </div>
      ))}
    </div>
  );
}
