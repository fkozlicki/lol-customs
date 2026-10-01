"use client";

import { useTranslations } from "next-intl";

/** The players still to be drawn, in order, for a room that shows its draw order. */
export function UpcomingOrder({ players }: { players: string[] }) {
  const t = useTranslations("auctions.room");

  return (
    <section>
      <h2 className="label-caps pb-2 text-foreground">{t("upcoming")}</h2>
      <ol className="num flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
        {players.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ol>
    </section>
  );
}
