"use client";

import { useTranslations } from "next-intl";
import type { AuctionEventView } from "./auction-room-view";

/** One event in the feed, said in the reader's language. */
export function EventLine({ event }: { event: AuctionEventView }) {
  const t = useTranslations("auctions.feed");
  const team = event.team;
  const player = event.player ?? t("player");
  const amount = event.amount;

  const text = {
    bid: () => t("bid", { team, amount, player }),
    opening_bid: () => t("openingBid", { team, player }),
    concede: () => t("concede", { team, player }),
    pass: () => t("pass", { team, player }),
    sold: () => t("sold", { team, amount, player }),
    auto_assigned: () => t("autoAssigned", { team, player }),
    captain_joined: () => t("joined", { team }),
    captain_left: () => t("left"),
    captain_removed: () => t("removed"),
    countdown_started: () => t("countdown"),
    countdown_cancelled: () => t("countdownCancelled"),
    auction_started: () => t("started"),
    player_revealed: () => t("revealed", { player }),
    completed: () => t("completed"),
    cancelled: () => t("cancelled"),
    lobby_updated: () => t("lobbyUpdated", { team }),
    ready: () => t("ready", { team }),
    unready: () => t("unready", { team }),
    created: () => t("created"),
  }[event.kind];

  return (
    <li className="flex items-baseline gap-3 py-2.5">
      <time className="num shrink-0 text-[11px] text-muted-foreground">
        {event.time}
      </time>
      <p className="text-sm">{text()}</p>
    </li>
  );
}
