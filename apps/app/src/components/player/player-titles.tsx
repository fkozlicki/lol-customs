"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { cn } from "@v1/ui/cn";
import Link from "next/link";
import { useSeasonParam } from "@/components/dashboard/use-season-param";
import { formatHofValue, HOF_SECTIONS } from "@/components/hof/hof-config";
import { useScopedI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/react";
import { withSeason } from "@/utils/season";

interface PlayerTitlesProps {
  puuid: string;
  season: number;
}

/** Hall of Fame titles the player currently holds on the selected track. */
export function PlayerTitles({ puuid, season }: PlayerTitlesProps) {
  const t = useScopedI18n("dashboard.pages.hallOfFame");
  const trpc = useTRPC();
  const seasonParam = useSeasonParam();
  const { data } = useSuspenseQuery(
    trpc.riftRank.hallOfFame.queryOptions({ season }),
  );

  const held = HOF_SECTIONS.flatMap((section) =>
    section.rows.flatMap((row) =>
      [
        row.best && { entry: row.best, worst: false },
        row.worst && { entry: row.worst, worst: true },
      ].filter((item) => item != null),
    ),
  ).flatMap(({ entry, worst }) => {
    const holder = data[entry.id]?.holders.find(
      ({ player }) => player.puuid === puuid,
    );
    return holder ? [{ entry, worst, value: holder.value }] : [];
  });

  if (held.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-1.5">
      {held.map(({ entry, worst, value }) => (
        <li key={entry.id}>
          <Link
            href={withSeason("/hof", seasonParam)}
            title={t(`cards.${entry.id}.description`)}
            className={cn(
              "flex items-center gap-2 border px-2 py-1 transition-colors hover:bg-muted",
              worst && "border-dashed",
            )}
          >
            <span
              className={cn(
                "label-caps text-foreground",
                entry.id === "mvp" && "text-mvp",
                entry.id === "ace" && "text-ace",
              )}
            >
              {t(`cards.${entry.id}.title`)}
            </span>
            <span className="num text-xs text-muted-foreground">
              {formatHofValue(entry, value)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
