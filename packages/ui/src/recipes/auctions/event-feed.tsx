"use client";

import { useTranslations } from "next-intl";
import { useId } from "react";
import type { AuctionEventView } from "./auction-room-view";
import { EventLine } from "./event-line";

/** What has happened in the room, newest first. */
export function EventFeed({ events }: { events: AuctionEventView[] }) {
  const t = useTranslations("auctions.feed");
  const headingId = useId();

  return (
    <section>
      <h2 id={headingId} className="label-caps pb-2 text-foreground">
        {t("title")}
      </h2>
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <ol
          // biome-ignore lint/a11y/noNoninteractiveTabindex: a scrolling region has to be reachable from the keyboard (WCAG 2.1.1, axe scrollable-region-focusable); it is named after its heading
          tabIndex={0}
          aria-labelledby={headingId}
          className="max-h-[420px] divide-y overflow-y-auto"
        >
          {events.map((event) => (
            <EventLine key={event.key} event={event} />
          ))}
        </ol>
      )}
    </section>
  );
}
