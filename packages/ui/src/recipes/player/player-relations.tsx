"use client";

import { useTranslations } from "next-intl";
import { SectionHeading } from "../section-heading";
import { WinLoss } from "../win-loss";
import type { RelationsView, RelationView } from "./player-view";
import { RelationRow } from "./relation-row";

function record(relation: RelationView) {
  return (
    <WinLoss
      className="text-base font-semibold"
      wins={relation.wins}
      losses={relation.losses}
    />
  );
}

/** Who a player wins and loses with, and who they beat or struggle against. */
export function PlayerRelations({ relations }: { relations: RelationsView }) {
  const t = useTranslations("player");
  const { teammates, rivals } = relations;
  const kills = (relation: RelationView) =>
    t("killsCount", { count: relation.kills });

  return (
    <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-1">
      <section>
        <SectionHeading>{t("teammates")}</SectionHeading>
        <ul className="divide-y">
          <RelationRow
            label={t("mostMatchesWith")}
            relation={teammates.mostMatches}
            detail={(r) => t("matchesTogether", { count: r.matches })}
          />
          <RelationRow
            label={t("mostWinsWith")}
            relation={teammates.mostWins}
            detail={record}
          />
          <RelationRow
            label={t("mostLossesWith")}
            relation={teammates.mostLosses}
            detail={record}
          />
        </ul>
      </section>

      <section>
        <SectionHeading>{t("rivals")}</SectionHeading>
        <ul className="divide-y">
          <RelationRow
            label={t("bestRecord")}
            relation={rivals.bestRecord}
            detail={record}
          />
          <RelationRow
            label={t("worstRecord")}
            relation={rivals.worstRecord}
            detail={record}
          />
          <RelationRow
            label={t("mostKilled")}
            relation={rivals.mostKilled}
            emptyLabel={t("noKillData")}
            detail={kills}
          />
          <RelationRow
            label={t("mostKilledBy")}
            relation={rivals.mostKilledBy}
            emptyLabel={t("noKillData")}
            detail={kills}
          />
        </ul>
      </section>
    </div>
  );
}
