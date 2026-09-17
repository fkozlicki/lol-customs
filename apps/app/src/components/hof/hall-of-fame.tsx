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
  HOF_OTHER_RECORDS,
  HOF_SECTIONS,
  HOF_TITLES,
  type HofTitle,
} from "./hof-config";

type HallOfFameData = RouterOutputs["riftRank"]["hallOfFame"];
type HofStanding = HallOfFameData[string];
type HofPlayer = HofStanding["holders"][number]["player"];

export function HallOfFame({ season }: { season: number }) {
  const t = useScopedI18n("dashboard.pages.hallOfFame");
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.riftRank.hallOfFame.queryOptions({ season }),
  );

  const hasHolders = HOF_TITLES.some(
    (entry) => (data[entry.id]?.holders.length ?? 0) > 0,
  );
  if (!hasHolders) return <HallOfFameEmpty season={season} />;

  return (
    <div className="space-y-14">
      <TitleCounts data={data} />

      {HOF_SECTIONS.map((section) => (
        <section key={section.id}>
          <SectionTitle>{t(`sections.${section.id}`)}</SectionTitle>
          <div className="hidden grid-cols-2 pb-2 md:grid">
            <span className="label-caps">{t("best")}</span>
            <span className="label-caps pl-6">{t("worst")}</span>
          </div>
          <div className="divide-y border-y">
            {section.pairs.map((pair) => (
              <div key={pair.best.id} className="grid md:grid-cols-2">
                <TitleCell
                  entry={pair.best}
                  standing={data[pair.best.id]}
                  className="md:pr-6"
                />
                <TitleCell
                  entry={pair.worst}
                  standing={data[pair.worst.id]}
                  className="border-t md:border-t-0 md:border-l md:pl-6"
                />
              </div>
            ))}
            {section.singles?.map((entry) => (
              <TitleCell
                key={entry.id}
                entry={entry}
                standing={data[entry.id]}
              />
            ))}
          </div>
        </section>
      ))}

      <section>
        <SectionTitle>{t("otherRecords")}</SectionTitle>
        <div className="grid border-t md:grid-cols-2 md:gap-x-12">
          {HOF_OTHER_RECORDS.map((entry) => (
            <TitleCell
              key={entry.id}
              entry={entry}
              standing={data[entry.id]}
              className="border-b"
            />
          ))}
        </div>
      </section>
    </div>
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
    for (const { player } of data[entry.id]?.holders ?? []) {
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
      <CollectorList label={t("mostWorst")} rows={top("worst")} />
    </div>
  );
}

const MAX_PIPS = 12;

function CollectorList({
  label,
  rows,
  filled = false,
}: {
  label: string;
  rows: { player: HofPlayer; titles: number }[];
  filled?: boolean;
}) {
  const season = useSeasonParam();

  return (
    <section>
      <h2 className="label-caps pb-3 text-foreground">{label}</h2>
      <ol className="divide-y border-y">
        {rows.map(({ player, titles }) => (
          <li key={player.puuid}>
            <Link
              href={withSeason(
                playerHref(player.game_name, player.tag_line),
                season,
              )}
              className="group flex h-12 items-center gap-3"
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
  standing,
  className,
}: {
  entry: HofTitle;
  standing: HofStanding | undefined;
  className?: string;
}) {
  const t = useScopedI18n("dashboard.pages.hallOfFame");
  const locale = useCurrentLocale();
  const season = useSeasonParam();
  const holders = standing?.holders ?? [];
  const runnersUp = standing?.runnersUp ?? [];
  const holder = holders[0];
  const runnerUp = runnersUp[0];
  const toneClass =
    entry.id === "mvp" ? "text-mvp" : entry.id === "ace" ? "text-ace" : null;

  return (
    <div
      className={cn("flex min-w-0 items-center gap-4 py-3 sm:py-4", className)}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className={cn("label-caps text-foreground", toneClass)}>
          {entry.kind === "worst" && (
            <span className="text-muted-foreground md:hidden">
              {t("worst")} ·{" "}
            </span>
          )}
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
            <span className="min-w-0 truncate text-sm font-medium">
              {holders.map(({ player }, index) => (
                <Fragment key={player.puuid}>
                  {index > 0 && ", "}
                  <Link
                    href={withSeason(
                      playerHref(player.game_name, player.tag_line),
                      season,
                    )}
                    className="underline-offset-4 hover:underline"
                  >
                    {player.game_name ?? player.puuid.slice(0, 8)}
                  </Link>
                </Fragment>
              ))}
            </span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">{t("noHolder")}</span>
        )}

        {holder && runnerUp && (
          <span className="num hidden truncate text-xs text-muted-foreground sm:block">
            {t("runnerUp")}{" "}
            {runnersUp.length > 1
              ? t("playersTied", { count: runnersUp.length })
              : (runnerUp.player.game_name ??
                runnerUp.player.puuid.slice(0, 8))}
            {" · "}
            {formatHofValue(entry, runnerUp.value, locale)}
            {" · Δ "}
            {formatHofValue(
              entry,
              Math.abs(runnerUp.value - holder.value),
              locale,
            )}
          </span>
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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="label-caps border-t pt-3 pb-3 text-foreground">
      {children}
    </h2>
  );
}

/** One held title: filled for best, outlined for worst. */
function Pip({ filled = false }: { filled?: boolean }) {
  return (
    <span
      className={cn(
        "size-2",
        filled ? "bg-foreground" : "border border-muted-foreground",
      )}
    />
  );
}

export function HallOfFameSkeleton() {
  return (
    <div className="space-y-14">
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
