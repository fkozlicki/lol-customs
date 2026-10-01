"use client";

import { useTranslations } from "next-intl";
import { PageHeader } from "../page-header";
import { PageShell } from "../page-shell";
import { AuctionListEmpty } from "./auction-list-empty";
import { AuctionListError } from "./auction-list-error";
import { AuctionListSkeleton } from "./auction-list-skeleton";
import type { AuctionSummaryView } from "./auction-list-view";
import { AuctionSummaryCard } from "./auction-summary-card";
import { ConnectionBadge } from "./connection-badge";
import { CreateAuctionButton } from "./create-auction-button";

interface AuctionListPageProps {
  state: "loading" | "error" | "ready";
  auctions: AuctionSummaryView[];
  /** How the list keeps up with new auctions: live over realtime, polling, or connecting. */
  connection: "connecting" | "live" | "degraded";
  onCreate: () => void;
  /** While the session is still being read, creating waits. */
  createDisabled?: boolean;
  onRetry: () => void;
}

/** Every lobby and live auction, with a way to open a new one. */
export function AuctionListPage({
  state,
  auctions,
  connection,
  onCreate,
  createDisabled,
  onRetry,
}: AuctionListPageProps) {
  const t = useTranslations("auctions");

  return (
    <PageShell>
      <PageHeader title={t("title")} description={t("description")}>
        <div className="flex items-center gap-4">
          <ConnectionBadge state={connection} />
          <CreateAuctionButton onClick={onCreate} disabled={createDisabled} />
        </div>
      </PageHeader>

      {state === "loading" ? (
        <AuctionListSkeleton />
      ) : state === "error" ? (
        <AuctionListError onRetry={onRetry} />
      ) : auctions.length > 0 ? (
        <ul className="space-y-12">
          {auctions.map((auction) => (
            <li key={auction.id}>
              <AuctionSummaryCard auction={auction} />
            </li>
          ))}
        </ul>
      ) : (
        <AuctionListEmpty onCreate={onCreate} createDisabled={createDisabled} />
      )}
    </PageShell>
  );
}
