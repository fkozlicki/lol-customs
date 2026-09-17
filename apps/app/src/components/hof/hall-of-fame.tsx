"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import type { RouterOutputs } from "@v1/api";
import { ALL_TIME_SEASON, QUALIFICATION_MATCHES } from "@v1/api/season";
import { Button } from "@v1/ui/button";
import { cn } from "@v1/ui/cn";
import { Skeleton } from "@v1/ui/skeleton";
import Link from "next/link";
import { Fragment } from "react";
import { useSeasonParam } from "@/components/dashboard/use-season-param";
import { ProfileIcon } from "@/components/game-assets/profile-icon";
import { useCurrentLocale, useScopedI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/react";
import { playerHref } from "@/utils/riot-id";
import { ALL_TIME_PARAM, SEASON_PARAM, withSeason } from "@/utils/season";
import {
  formatHofValue,
  HOF_SECTIONS,
  HOF_TITLES,
  type HofTitle,
} from "./hof-config";

type HallOfFameData = RouterOutputs["riftRank"]["hallOfFame"];
type HofHolder = HallOfFameData[string][number];
type HofPlayer = HofHolder["player"];

export function HallOfFame({ season }: { season: number }) {
  const t = useScopedI18n("dashboard.pages.hallOfFame");
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.riftRank.hallOfFame.queryOptions({ season }),
  );

  const hasHolders = HOF_TITLES.some(
    (entry) => (data[entry.id]?.length ?? 0) > 0,
  );
  if (!hasHolders) return <HallOfFameEmpty season={season} />;

  return (
    <div className="space-y-16">
      <div className="space-y-8">
        <TitleCounts data={data} />
        <nav
          aria-label={t("jumpTo")}
          className="flex flex-wrap gap-x-5 gap-y-2 md:hidden"
        >
          {HOF_SECTIONS.map((section) => (
            <a
              key={section.id}
              href={`#hof-${section.id}`}
              className="label-caps underline-offset-4 hover:text-foreground hover:underline"
            >
              {t(`sections.${section.id}`)}
            </a>
          ))}
        </nav>
      </div>

      {HOF_SECTIONS.map((section) => (
        <section
          key={section.id}
          id={`hof-${section.id}`}
          className="scroll-mt-20"
        >
          <SectionHeading>{t(`sections.${section.id}`)}</SectionHeading>
          <TitleRows
            rows={section.pairs.map((pair) => [pair.best, pair.worst])}
            data={data}
            paired
          />
          <SingleTitles singles={section.singles ?? []} data={data} />
        </section>
      ))}
    </div>
  );
}

/**
 * Rows of two titles. A pair stays together on phones (no divider inside it); unpaired titles get a
 * divider each.
 */
function TitleRows({
  rows,
  data,
  paired = false,
  className,
}: {
  rows: HofTitle[][];
  data: HallOfFameData;
  paired?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("divide-y", className)}>
      {rows.map((row) => (
        <div
          key={row[0]?.id}
          className={cn(
            "grid md:grid-cols-2 md:gap-24",
            !paired && "divide-y md:divide-y-0",
          )}
        >
          {row.map((entry, index) => (
            <TitleCell
              key={entry.id}
              entry={entry}
              holders={data[entry.id] ?? []}
              className={cn(
                paired && "first:pb-2 md:first:pb-4",
                index === 1 && "md:justify-self-end",
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="pb-3 text-2xl font-semibold uppercase leading-none tracking-[-0.03em] sm:text-3xl">
      {children}
    </h2>
  );
}

/** Unpaired titles nobody holds on this track are noise, so they are left out. */
function SingleTitles({
  singles,
  data,
}: {
  singles: HofTitle[];
  data: HallOfFameData;
}) {
  const held = singles.filter((entry) => (data[entry.id]?.length ?? 0) > 0);
  if (held.length === 0) return null;

  return <TitleRows rows={chunkPairs(held)} data={data} className="mt-8" />;
}

function chunkPairs(entries: HofTitle[]): HofTitle[][] {
  return entries.flatMap((_, index) =>
    index % 2 === 0 ? [entries.slice(index, index + 2)] : [],
  );
}

/** Early in a season nobody is qualified yet; point to a track that has titles instead of empty tables. */
function HallOfFameEmpty({ season }: { season: number }) {
  const t = useScopedI18n("dashboard.pages.hallOfFame");
  const tSeason = useScopedI18n("dashboard.season");
  const trpc = useTRPC();
  const { data: seasons } = useSuspenseQuery(trpc.seasons.list.queryOptions());
  const index = seasons.findIndex((s) => s.id === season);
  const previous = index > 0 ? seasons[index - 1] : undefined;

  return (
    <section className="flex flex-col items-start gap-5 py-6">
      <div className="space-y-2">
        <p className="text-xl font-semibold tracking-[-0.02em] sm:text-2xl">
          {t("emptyTitle")}
        </p>
        <p className="text-sm text-muted-foreground">
          {t("emptyHint", { count: QUALIFICATION_MATCHES })}
        </p>
      </div>
      {season !== ALL_TIME_SEASON && (
        <div className="flex flex-wrap gap-2">
          {previous && (
            <Button asChild variant="outline" size="sm">
              <Link href={`?${SEASON_PARAM}=${previous.id}`}>
                {t("showSeason", { number: previous.number })}
              </Link>
            </Button>
          )}
          <Button asChild variant="ghost" size="sm">
            <Link href={`?${SEASON_PARAM}=${ALL_TIME_PARAM}`}>
              {tSeason("showAllTime")}
            </Link>
          </Button>
        </div>
      )}
    </section>
  );
}

/** Who collects the most best and the most worst titles: the page's opening story. */
function TitleCounts({ data }: { data: HallOfFameData }) {
  const t = useScopedI18n("dashboard.pages.hallOfFame");

  const counts = new Map<
    string,
    { player: HofPlayer; best: number; worst: number }
  >();
  for (const entry of HOF_TITLES) {
    for (const { player } of data[entry.id] ?? []) {
      const count = counts.get(player.puuid) ?? { player, best: 0, worst: 0 };
      count[entry.kind] += 1;
      counts.set(player.puuid, count);
    }
  }
  const top = (kind: "best" | "worst") =>
    [...counts.values()]
      .filter((count) => count[kind] > 0)
      .sort(
        (a, b) =>
          b[kind] - a[kind] ||
          (a.player.game_name ?? "").localeCompare(b.player.game_name ?? ""),
      )
      .slice(0, 3)
      .map((count) => ({ player: count.player, titles: count[kind] }));

  return (
    <div className="grid gap-10 md:grid-cols-2 md:gap-12">
      <CollectorList label={t("mostBest")} rows={top("best")} filled />
      <CollectorList
        label={t("mostWorst")}
        rows={top("worst")}
        className="md:justify-self-end"
      />
    </div>
  );
}

const MAX_PIPS = 12;

function CollectorList({
  label,
  rows,
  filled = false,
  className,
}: {
  label: string;
  rows: { player: HofPlayer; titles: number }[];
  filled?: boolean;
  className?: string;
}) {
  const season = useSeasonParam();

  return (
    <section className={cn("w-full md:max-w-md", className)}>
      <h2 className="pb-2 text-lg font-semibold uppercase leading-none tracking-[-0.02em] sm:text-xl">
        {label}
      </h2>
      <ol>
        {rows.map(({ player, titles }) => (
          <li key={player.puuid}>
            <Link
              href={withSeason(
                playerHref(player.game_name, player.tag_line),
                season,
              )}
              className="group flex h-11 items-center gap-3"
            >
              <ProfileIcon
                iconId={player.profile_icon}
                name={player.game_name ?? "?"}
                fallbackChars={1}
                avatarClassName="size-7 rounded-none"
                fallbackClassName="rounded-none text-xs"
              />
              <span className="min-w-0 flex-1 truncate text-sm font-medium underline-offset-4 group-hover:underline">
                {player.game_name ?? player.puuid.slice(0, 8)}
              </span>
              <span className="flex w-28 shrink-0 items-center gap-0.5">
                {Array.from({ length: Math.min(titles, MAX_PIPS) }, (_, i) => (
                  <Pip key={i} filled={filled} />
                ))}
              </span>
              <span className="num w-6 shrink-0 text-right text-sm font-semibold">
                {titles}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

function TitleCell({
  entry,
  holders,
  className,
}: {
  entry: HofTitle;
  holders: HofHolder[];
  className?: string;
}) {
  const t = useScopedI18n("dashboard.pages.hallOfFame");
  const locale = useCurrentLocale();
  const holder = holders[0];
  const toneClass =
    entry.id === "mvp" ? "text-mvp" : entry.id === "ace" ? "text-ace" : null;

  return (
    <div
      className={cn(
        "flex w-full min-w-0 items-center gap-4 py-4 md:max-w-md",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className={cn("label-caps text-foreground", toneClass)}>
          {t(`cards.${entry.id}.title`)}
        </span>
        {holder ? (
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex shrink-0 -space-x-1.5">
              {holders.slice(0, 3).map(({ player }) => (
                <ProfileIcon
                  key={player.puuid}
                  iconId={player.profile_icon}
                  name={player.game_name ?? "?"}
                  fallbackChars={1}
                  avatarClassName="size-6 rounded-none ring-2 ring-background sm:size-7"
                  fallbackClassName="rounded-none text-[10px]"
                />
              ))}
            </div>
            <span className="min-w-0 truncate text-sm font-medium sm:hidden">
              <PlayerLink player={holder.player} />
              {holders.length > 1 && (
                <span className="num text-muted-foreground">
                  {" "}
                  +{holders.length - 1}
                </span>
              )}
            </span>
            <span className="hidden min-w-0 truncate text-sm font-medium sm:inline">
              {holders.map(({ player }, index) => (
                <Fragment key={player.puuid}>
                  {index > 0 && ", "}
                  <PlayerLink player={player} />
                </Fragment>
              ))}
            </span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">{t("noHolder")}</span>
        )}
      </div>

      {holder && (
        <div className="flex shrink-0 flex-col items-end">
          <span
            className={cn(
              "num text-xl font-semibold leading-none sm:text-2xl",
              toneClass,
            )}
          >
            {formatHofValue(entry, holder.value, locale)}
          </span>
          <span className="label-caps mt-1 text-[10px]">
            {t(`stats.${entry.stat}`)}
          </span>
        </div>
      )}
    </div>
  );
}

function PlayerLink({ player }: { player: HofPlayer }) {
  const season = useSeasonParam();

  return (
    <Link
      href={withSeason(playerHref(player.game_name, player.tag_line), season)}
      className="underline-offset-4 hover:underline"
    >
      {player.game_name ?? player.puuid.slice(0, 8)}
    </Link>
  );
}

/** One held title: filled for best, outlined for worst. */
function Pip({ filled = false }: { filled?: boolean }) {
  return (
    <span
      className={cn(
        "size-2",
        filled ? "bg-foreground" : "border border-foreground",
      )}
    />
  );
}

export function HallOfFameSkeleton() {
  return (
    <div className="space-y-16">
      <Skeleton className="h-40 w-full" />
      {HOF_SECTIONS.slice(0, 2).map((section) => (
        <div key={section.id} className="space-y-px">
          {section.pairs.map((pair) => (
            <Skeleton key={pair.best.id} className="h-20 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}
