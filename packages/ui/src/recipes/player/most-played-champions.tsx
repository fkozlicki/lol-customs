"use client";

import { useTranslations } from "next-intl";
import { ChampionImage } from "../game-assets/champion-image";
import { SectionHeading } from "../section-heading";
import { WinLoss } from "../win-loss";
import type { ChampionStatView } from "./player-view";

/** The champions a player picks most on the selected track, with their record on each. */
export function MostPlayedChampions({
  champions,
}: {
  champions: ChampionStatView[];
}) {
  const t = useTranslations("player");

  return (
    <section>
      <SectionHeading>{t("mostPlayed")}</SectionHeading>
      {champions.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noChampionData")}</p>
      ) : (
        <ul className="divide-y">
          {champions.map((champion) => (
            <li
              key={champion.championId}
              className="flex items-center gap-3 py-2.5 first:pt-0"
            >
              <ChampionImage
                championId={champion.championId}
                width={36}
                height={36}
                className="size-9 shrink-0"
              />
              <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                <div className="flex min-w-0 flex-col">
                  <span className="num text-sm">
                    {champion.matches}{" "}
                    <span className="label-caps">{t("matchesLabel")}</span>
                  </span>
                  <span className="num truncate text-xs text-muted-foreground">
                    {champion.kda}
                  </span>
                </div>
                <div className="num flex shrink-0 flex-col items-end">
                  <span className="text-sm font-semibold">
                    {champion.winrate}
                  </span>
                  <WinLoss
                    wins={champion.wins}
                    losses={champion.losses}
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
