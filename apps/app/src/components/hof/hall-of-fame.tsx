"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import type { RouterOutputs } from "@v1/api";
import { cn } from "@v1/ui/cn";
import { Skeleton } from "@v1/ui/skeleton";
import Link from "next/link";
import { Fragment } from "react";
import { useSeasonParam } from "@/components/dashboard/use-season-param";
import { ProfileIcon } from "@/components/game-assets/profile-icon";
import { useScopedI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/react";
import { playerHref } from "@/utils/riot-id";
import { withSeason } from "@/utils/season";
import {
  formatHofValue,
  HOF_SECTIONS,
  type HofRow,
  type HofTitle,
} from "./hof-config";

type HallOfFameData = RouterOutputs["riftRank"]["hallOfFame"];
type HofStanding = HallOfFameData[string];

export function HallOfFame({ season }: { season: number }) {
  const t = useScopedI18n("dashboard.pages.hallOfFame");
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.riftRank.hallOfFame.queryOptions({ season }),
  );

  return (
    <div className="space-y-12">
      {HOF_SECTIONS.map((section) => (
        <section key={section.id}>
          <h2 className="label-caps border-t pt-3 pb-4 text-foreground">
            {t(`sections.${section.id}`)}
          </h2>
          <div className="hidden grid-cols-2 border-t pt-2 pb-1 md:grid">
            <span className="label-caps">{t("best")}</span>
            <span className="label-caps pl-5">{t("worst")}</span>
          </div>
          <div className="divide-y border-b md:border-t-0 border-t">
            {section.rows.map((row) => (
              <HofRowView
                key={row.best?.id ?? row.worst?.id}
                row={row}
                data={data}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function HofRowView({ row, data }: { row: HofRow; data: HallOfFameData }) {
  return (
    <div className="grid md:grid-cols-2 md:divide-x">
      {row.best ? (
        <TitleCell entry={row.best} standing={data[row.best.id]} />
      ) : (
        <div className="hidden md:block" />
      )}
      {row.worst ? (
        <TitleCell entry={row.worst} standing={data[row.worst.id]} worst />
      ) : (
        <div className="hidden md:block" />
      )}
    </div>
  );
}

function TitleCell({
  entry,
  standing,
  worst = false,
}: {
  entry: HofTitle;
  standing: HofStanding | undefined;
  worst?: boolean;
}) {
  const t = useScopedI18n("dashboard.pages.hallOfFame");
  const season = useSeasonParam();
  const holders = standing?.holders ?? [];
  const runnersUp = standing?.runnersUp ?? [];
  const holder = holders[0];
  const runnerUp = runnersUp[0];
  const toneClass =
    entry.id === "mvp" ? "text-mvp" : entry.id === "ace" ? "text-ace" : null;

  return (
    <div
      className={cn(
        "flex min-w-0 gap-4 py-4 md:px-5",
        worst ? "md:pr-0" : "md:pl-0",
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-col">
          <span className={cn("label-caps text-foreground", toneClass)}>
            {worst && (
              <span className="text-muted-foreground md:hidden">
                {t("worst")} ·{" "}
              </span>
            )}
            {t(`cards.${entry.id}.title`)}
          </span>
          <span className="text-xs text-muted-foreground">
            {t(`cards.${entry.id}.description`)}
          </span>
        </div>

        {holder ? (
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex shrink-0 -space-x-2">
              {holders.slice(0, 3).map(({ player }) => (
                <ProfileIcon
                  key={player.puuid}
                  iconId={player.profile_icon}
                  name={player.game_name ?? "?"}
                  fallbackChars={1}
                  avatarClassName="size-8 rounded-none ring-2 ring-background"
                  fallbackClassName="rounded-none text-xs"
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
          <span className="num truncate text-xs text-muted-foreground">
            {t("runnerUp")}{" "}
            {runnerUp.player.game_name ?? runnerUp.player.puuid.slice(0, 8)}
            {runnersUp.length > 1 &&
              ` ${t("andMore", { count: runnersUp.length - 1 })}`}
            {" · "}
            {formatHofValue(entry, runnerUp.value)} (
            {formatGap(entry, runnerUp.value - holder.value)})
          </span>
        )}
      </div>

      {holder && (
        <div className="flex shrink-0 flex-col items-end justify-center">
          <span
            className={cn("num text-2xl font-semibold leading-none", toneClass)}
          >
            {formatHofValue(entry, holder.value)}
          </span>
          <span className="label-caps mt-1">{t(`units.${entry.unit}`)}</span>
        </div>
      )}
    </div>
  );
}

/** Signed distance from the holder, e.g. −0.3 or +12. */
function formatGap(entry: HofTitle, gap: number): string {
  const sign = gap > 0 ? "+" : "−";
  return `${sign}${formatHofValue(entry, Math.abs(gap))}`;
}

export function HallOfFameSkeleton() {
  return (
    <div className="space-y-12">
      {HOF_SECTIONS.slice(0, 2).map((section) => (
        <div key={section.id} className="space-y-px border-t pt-12">
          {section.rows.map((row) => (
            <Skeleton
              key={row.best?.id ?? row.worst?.id}
              className="h-24 w-full"
            />
          ))}
        </div>
      ))}
    </div>
  );
}
