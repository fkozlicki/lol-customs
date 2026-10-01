"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { HallOfFame as HallOfFameView } from "@v1/ui/recipes/hof/hall-of-fame";
import { useLocale, useTranslations } from "next-intl";
import { useSeasonParam } from "@/components/dashboard/use-season-param";
import { useTRPC } from "@/trpc/react";
import { HallOfFameEmptyState } from "./hall-of-fame-empty-state";
import { hasTitleHolders, toHallOfFameView } from "./hall-of-fame-view";

/** The Hall of Fame on one rating track, or where to look instead while nobody holds a title. */
export function HallOfFame({ season }: { season: number }) {
  const t = useTranslations("dashboard.pages.hallOfFame");
  const locale = useLocale();
  const seasonParam = useSeasonParam();
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.riftRank.hallOfFame.queryOptions({ season }),
  );

  if (!hasTitleHolders(data)) return <HallOfFameEmptyState season={season} />;

  return (
    <HallOfFameView
      hallOfFame={toHallOfFameView(data, {
        locale,
        season: seasonParam,
        text: {
          section: (id) => t(`sections.${id}`),
          title: (id) => t(`cards.${id}.title`),
          stat: (id) => t(`stats.${id}`),
        },
      })}
    />
  );
}
