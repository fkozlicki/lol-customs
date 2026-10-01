"use client";

import { useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/table";
import { cn } from "../../utils/cn";
import type { SideView } from "./match-view";
import { TeamRow } from "./team-row";

/** One side's scoreboard; the header carries the result in its colour. */
export default function TeamTable({ team }: { team: SideView }) {
  const t = useTranslations("match");

  return (
    <Table className="w-full">
      <colgroup>
        <col className="w-auto" />
        <col className="w-[75px]" />
        <col className="w-[98px]" />
        <col className="w-[100px]" />
        <col className="w-[56px]" />
        <col className="w-[56px]" />
        <col className="w-[195px]" />
      </colgroup>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>
            <span
              className={cn("label-caps", team.won ? "text-win" : "text-loss")}
            >
              {team.won ? t("victory") : t("defeat")}
            </span>{" "}
            <span className="label-caps">
              · {team.side === "blue" ? t("sideBlue") : t("sideRed")}
            </span>
          </TableHead>
          <TableHead className="label-caps text-center">
            {t("opScore")}
          </TableHead>
          <TableHead className="label-caps text-center">{t("kda")}</TableHead>
          <TableHead className="label-caps text-center">
            {t("damage")}
          </TableHead>
          <TableHead className="label-caps text-center">{t("wards")}</TableHead>
          <TableHead className="label-caps text-center">{t("cs")}</TableHead>
          <TableHead className="label-caps text-center">{t("items")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {team.participants.map((p) => (
          <TeamRow key={p.key} participant={p} />
        ))}
      </TableBody>
    </Table>
  );
}
