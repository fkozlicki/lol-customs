"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { formatKda, formatWinrate } from "@v1/domain/stats";
import { ChampionImage } from "@/components/game-assets/champion-image";
import { SectionHeading } from "@/components/page-header";
import { useScopedI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/react";
import { WinLoss } from "@/components/win-loss";

interface MostPlayedChampionsProps {
  puuid: string;
  season: number;
}

export function MostPlayedChampions({
  puuid,
  season,
}: MostPlayedChampionsProps) {
  const t = useScopedI18n("dashboard.pages.player");
  const trpc = useTRPC();
  const { data: champions } = useSuspenseQuery(
    trpc.players.mostPlayedChampions.queryOptions({ puuid, season, limit: 5 }),
  );

  return (
    <section>
      <SectionHeading>{t("mostPlayed")}</SectionHeading>
      {!champions || champions.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noChampionData")}</p>
      ) : (
        <ul className="divide-y">
          {champions.map((champ) => (
            <li
              key={champ.championId}
              className="flex items-center gap-3 py-2.5 first:pt-0"
            >
              <ChampionImage
                championId={champ.championId}
                width={36}
                height={36}
                className="size-9 shrink-0"
              />
              <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                <div className="flex min-w-0 flex-col">
                  <span className="num text-sm">
                    {champ.games}{" "}
                    <span className="label-caps">{t("matchesLabel")}</span>
                  </span>
                  <span className="num truncate text-xs text-muted-foreground">
                    {formatKda(
                      champ.kills / champ.games,
                      champ.deaths / champ.games,
                      champ.assists / champ.games,
                    )}
                  </span>
                </div>
                <div className="num flex shrink-0 flex-col items-end">
                  <span className="text-sm font-semibold">
                    {formatWinrate(champ.wins, champ.games - champ.wins)}
                  </span>
                  <WinLoss
                    wins={champ.wins}
                    losses={champ.games - champ.wins}
                    className="text-xs"
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
