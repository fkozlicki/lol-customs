"use client";

import { useTranslations } from "next-intl";
import type { AuctionEventView } from "./auction-room-view";
import { EventLine } from "./event-line";

/** What has happened in the room, newest first. */
export function EventFeed({ events }: { events: AuctionEventView[] }) {
  const t = useTranslations("auctions.feed");

  return (
    <section>
      <h2 className="label-caps pb-2 text-foreground">{t("title")}</h2>
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <ol className="max-h-[420px] divide-y overflow-y-auto">
          {events.map((event) => (
            <EventLine key={event.key} event={event} />
          ))}
        </ol>
      )}
    </section>
  );
}
