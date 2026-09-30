"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { PlayerTitles as PlayerTitlesView } from "@v1/ui/recipes/player/player-titles";
import { useLocale, useTranslations } from "next-intl";
import { useSeasonParam } from "@/components/dashboard/use-season-param";
import { useTRPC } from "@/trpc/react";
import { withSeason } from "@/utils/season";
import { toHeldTitles } from "./player-view";

interface PlayerTitlesProps {
  puuid: string;
  season: number;
}

export function PlayerTitles({ puuid, season }: PlayerTitlesProps) {
  const t = useTranslations("dashboard.pages.hallOfFame.cards");
  const locale = useLocale();
  const trpc = useTRPC();
  const seasonParam = useSeasonParam();
  const { data } = useSuspenseQuery(
    trpc.riftRank.hallOfFame.queryOptions({ season }),
  );

  const titles = toHeldTitles(data, puuid, {
    locale,
    href: withSeason("/hof", seasonParam),
    text: (id) => ({
      title: t(`${id}.title`),
      description: t(`${id}.description`),
    }),
  });

  return <PlayerTitlesView titles={titles} />;
}
