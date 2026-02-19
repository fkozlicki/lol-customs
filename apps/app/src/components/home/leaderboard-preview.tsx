"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@v1/ui/card";
import { Icons } from "@v1/ui/icons";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@v1/ui/table";
import { useScopedI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/react";
import LeaderboardRow from "./leaderboard-row";

interface LeaderboardProps {
  limit?: number;
}

export function Leaderboard({ limit = 50 }: LeaderboardProps) {
  const t = useScopedI18n("dashboard.pages.leaderboard");
  const trpc = useTRPC();
  const { data: leaderboard } = useSuspenseQuery(
    trpc.riftRank.leaderboard.queryOptions({ limit }),
  );

  if (!leaderboard?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("emptyTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">{t("noPlayersYet")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="border rounded-2xl">
      <Table>
        <TableHeader>
          <TableRow className="text-muted-foreground border-b bg-muted/20 hover:bg-muted/20">
            <TableHead className="w-14 px-4 py-3">
              <Icons.Leaderboard className="size-4" />
            </TableHead>
            <TableHead className="min-w-[200px] px-4 py-3">
              {t("tablePlayer")}
            </TableHead>
            <TableHead className="w-20 px-4 py-3 text-center">
              {t("tableRating")}
            </TableHead>
            <TableHead className="w-14 px-4 py-3 text-center">
              {t("tableWr")}
            </TableHead>
            <TableHead className="w-28 px-4 py-3 text-center">
              {t("tableKda")}
            </TableHead>
            <TableHead className="w-20 px-4 py-3 text-center">
              {t("tableStreak")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leaderboard.map((row, index) => (
            <LeaderboardRow key={row.puuid} row={row} index={index} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
