"use client";

import { useTranslations } from "next-intl";
import { Icons } from "../../components/icons";
import type { TeamRosterView } from "./auction-room-view";
import { RosterSlot } from "./roster-slot";

/** One side's captain, budget left and the players bought so far, with empty slots still to fill. */
export function TeamRoster({ roster }: { roster: TeamRosterView }) {
  const t = useTranslations("auctions");
  const spent = roster.budget - roster.remaining;
  const slots = Array.from(
    { length: roster.slots },
    (_, index) => roster.players[index] ?? null,
  );

  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="min-w-0 truncate text-xl font-semibold uppercase tracking-[-0.02em]">
            {roster.teamName ?? t(`room.team${roster.side}`)}
          </h2>
          <span className="num shrink-0 text-2xl font-semibold">
            ${roster.remaining}
          </span>
        </div>
        <div className="flex h-1 bg-foreground/15">
          <div
            className="bg-foreground"
            style={{ width: `${(spent / roster.budget) * 100}%` }}
          />
        </div>
        {roster.leading && (
          <span className="label-caps block text-foreground">
            {t("room.leadingShort")}
          </span>
        )}
      </div>

      <ol className="divide-y border-b">
        <li className="flex h-14 items-center gap-3">
          <span className="num w-4 shrink-0 text-xs text-muted-foreground">
            1
          </span>
          <div className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5 truncate text-sm font-medium">
              {roster.captainName ?? t("lobby.openSlot")}
              <Icons.Captain className="size-3.5 shrink-0 text-muted-foreground" />
            </span>
            <span className="label-caps">{t("room.captain")}</span>
          </div>
        </li>
        {slots.map((player, index) => (
          <RosterSlot
            key={player?.id ?? `empty-${index}`}
            position={index + 2}
            player={player}
          />
        ))}
      </ol>
    </section>
  );
}
