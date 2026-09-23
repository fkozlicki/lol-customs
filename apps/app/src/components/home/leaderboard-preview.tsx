"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { QUALIFICATION_MATCHES } from "@v1/api/season";
import { cn } from "@v1/ui/cn";
import { motion } from "motion/react";
import { DownloadAppButton } from "@/components/dashboard/download-app-button";
import { useScopedI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/react";
import { DURATION } from "@/utils/motion";
import { maxHistoricallyAfterGames } from "./leaderboard-after-games";
import LeaderboardRow from "./leaderboard-row";
import { SeasonPodium } from "./season-podium";

interface LeaderboardProps {
  season: number;
  seasonTitle: string;
  limit?: number;
  after?: number;
  historyPicker?: React.ReactNode;
}

function parseAfterGames(
  totalMatches: number,
  value: number | undefined,
): number | undefined {
  if (value == null) {
    return undefined;
  }
  const maxAfter = maxHistoricallyAfterGames(totalMatches);
  if (!Number.isInteger(value) || value < 1 || maxAfter < 1) {
    return undefined;
  }
  return Math.min(value, maxAfter);
}

export function Leaderboard({
  season,
  seasonTitle,
  limit = 50,
  after,
  historyPicker,
}: LeaderboardProps) {
  const t = useScopedI18n("dashboard.pages.leaderboard");
  const trpc = useTRPC();
  const { data: gamesPlayed = 0 } = useSuspenseQuery(
    trpc.riftRank.ladderRatedMatchCount.queryOptions({ season }),
  );

  const afterGames = parseAfterGames(gamesPlayed, after);

  const { data: leaderboard } = useSuspenseQuery(
    trpc.riftRank.leaderboard.queryOptions({
      season,
      limit,
      afterGames,
    }),
  );

  const qualified = leaderboard.filter((row) => row.qualified);
  const qualifying = leaderboard.filter((row) => !row.qualified);

  return (
    <div className="space-y-12 sm:space-y-16">
      <section className="space-y-8 sm:space-y-12">
        <div className="space-y-3">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ inherit: true, duration: DURATION.base }}
            className="label-caps"
          >
            {t("title")}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ inherit: true, duration: DURATION.slow }}
            className="text-[clamp(3.25rem,13vw,9rem)] font-semibold uppercase leading-[0.85] tracking-[-0.045em]"
          >
            {seasonTitle}
          </motion.h1>
        </div>
        <SeasonPodium rows={leaderboard} />
      </section>

      <section className="space-y-4">
        {historyPicker}
        {leaderboard.length === 0 ? (
          <div className="flex flex-col items-start gap-4 border-t py-10">
            <p className="text-sm text-muted-foreground">{t("noMatchesYet")}</p>
            <DownloadAppButton />
          </div>
        ) : (
          <div className="-mx-4 overflow-x-auto sm:mx-0">
            <table className="w-full min-w-[20rem] border-collapse text-sm">
              <thead>
                <tr className="border-b text-left">
                  <Th className="w-12 pl-4 sm:pl-0">#</Th>
                  <Th>{t("tablePlayer")}</Th>
                  <Th className="text-right">{t("tableRating")}</Th>
                  <Th className="text-right">{t("tableWr")}</Th>
                  <Th className="hidden text-right sm:table-cell">
                    {t("tableMatches")}
                  </Th>
                  <Th className="hidden text-right md:table-cell">
                    {t("tableKda")}
                  </Th>
                  <Th className="hidden text-right md:table-cell">
                    {t("tableMvp")}
                  </Th>
                  <Th className="hidden text-right md:table-cell">
                    {t("tableAce")}
                  </Th>
                  <Th className="hidden pr-4 text-right sm:table-cell sm:pr-0">
                    {t("tableStreak")}
                  </Th>
                </tr>
              </thead>
              <tbody>
                {qualified.map((row, index) => (
                  <LeaderboardRow
                    key={row.puuid}
                    row={row}
                    position={row.position}
                    index={index}
                  />
                ))}
                {qualifying.length > 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 pt-10 pb-3 sm:px-0">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <span className="label-caps text-foreground">
                          {t("qualifyingTitle")}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {t("qualifyingHint", {
                            count: QUALIFICATION_MATCHES,
                          })}
                        </span>
                      </div>
                    </td>
                  </tr>
                )}
                {qualifying.map((row, index) => (
                  <LeaderboardRow
                    key={row.puuid}
                    row={row}
                    index={qualified.length + index}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Th({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <th
      className={cn(
        "label-caps h-10 px-3 font-normal first:pl-4 sm:first:pl-0",
        className,
      )}
    >
      {children}
    </th>
  );
}
