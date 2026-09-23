"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import type { RouterOutputs } from "@v1/api";
import { playerHref } from "@v1/domain/riot-id";
import Link from "next/link";
import { useSeasonParam } from "@/components/dashboard/use-season-param";
import { ProfileIcon } from "@/components/game-assets/profile-icon";
import { SectionHeading } from "@/components/page-header";
import { useScopedI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/react";
import { withSeason } from "@/utils/season";

type Relations = RouterOutputs["players"]["relations"];
type Relation = Relations["teammates"]["mostMatches"];

interface PlayerRelationsProps {
  puuid: string;
  season: number;
}

/** Who a player wins and loses with, and who they beat or struggle against. */
export function PlayerRelations({ puuid, season }: PlayerRelationsProps) {
  const t = useScopedI18n("dashboard.pages.player");
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.players.relations.queryOptions({ puuid, season }),
  );
  const { teammates, rivals } = data;

  return (
    <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-1">
      <section>
        <SectionHeading>{t("teammates")}</SectionHeading>
        <ul className="divide-y">
          <RelationRow
            label={t("mostMatchesWith")}
            relation={teammates.mostMatches}
            detail={(r) => t("matchesTogether", { count: r.matches ?? 0 })}
          />
          <RelationRow
            label={t("mostWinsWith")}
            relation={teammates.mostWins}
            detail={(r) => <WinLossRecord wins={r.wins} losses={r.losses} />}
          />
          <RelationRow
            label={t("mostLossesWith")}
            relation={teammates.mostLosses}
            detail={(r) => <WinLossRecord wins={r.wins} losses={r.losses} />}
          />
        </ul>
      </section>

      <section>
        <SectionHeading>{t("rivals")}</SectionHeading>
        <ul className="divide-y">
          <RelationRow
            label={t("bestRecord")}
            relation={rivals.bestRecord}
            detail={(r) => <WinLossRecord wins={r.wins} losses={r.losses} />}
          />
          <RelationRow
            label={t("worstRecord")}
            relation={rivals.worstRecord}
            detail={(r) => <WinLossRecord wins={r.wins} losses={r.losses} />}
          />
          <RelationRow
            label={t("mostKilled")}
            relation={rivals.mostKilled}
            emptyLabel={t("noKillData")}
            detail={(r) => t("killsCount", { count: r.kills ?? 0 })}
          />
          <RelationRow
            label={t("mostKilledBy")}
            relation={rivals.mostKilledBy}
            emptyLabel={t("noKillData")}
            detail={(r) => t("killsCount", { count: r.kills ?? 0 })}
          />
        </ul>
      </section>
    </div>
  );
}

function RelationRow({
  label,
  relation,
  detail,
  emptyLabel,
}: {
  label: string;
  relation: Relation;
  detail: (relation: NonNullable<Relation>) => React.ReactNode;
  emptyLabel?: string;
}) {
  const t = useScopedI18n("dashboard.pages.player");
  const season = useSeasonParam();

  if (!relation) {
    return (
      <li className="flex h-14 flex-col justify-center">
        <span className="label-caps">{label}</span>
        <span className="truncate text-xs text-muted-foreground">
          {emptyLabel ?? t("noRelation")}
        </span>
      </li>
    );
  }

  const { player } = relation;
  const name = player.game_name ?? player.puuid.slice(0, 8);

  return (
    <li>
      <Link
        href={withSeason(playerHref(player.game_name, player.tag_line), season)}
        className="group flex h-14 items-center gap-3"
      >
        <ProfileIcon
          iconId={player.profile_icon}
          name={name}
          fallbackChars={1}
          avatarClassName="size-8 rounded-none"
          fallbackClassName="rounded-none text-xs"
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="label-caps">{label}</span>
          <span className="truncate text-sm font-medium underline-offset-4 group-hover:underline">
            {name}
          </span>
        </div>
        <span className="num shrink-0 text-sm text-muted-foreground">
          {detail(relation)}
        </span>
      </Link>
    </li>
  );
}

function WinLossRecord({
  wins,
  losses,
}: {
  wins: number | null;
  losses: number | null;
}) {
  return (
    <span className="num text-base font-semibold">
      <span className="text-win">{wins ?? 0}</span>
      <span className="text-muted-foreground">–</span>
      <span className="text-loss">{losses ?? 0}</span>
    </span>
  );
}
