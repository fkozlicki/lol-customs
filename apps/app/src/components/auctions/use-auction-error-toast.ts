"use client";

import type { AuctionRule } from "@v1/domain/auction";
import { toast } from "@v1/ui/sonner";
import { useTranslations } from "next-intl";

/** A failed auction action as tRPC hands it over: the API names the auction rule it broke, if any. */
interface AuctionActionError {
  data?: { auctionRule?: AuctionRule | null } | null;
}

/** Toasts a refused auction action in the viewer's language. */
export function useAuctionErrorToast() {
  const t = useTranslations("dashboard.pages.auctions.errors");
  return (error: AuctionActionError) =>
    toast.error(t(error.data?.auctionRule ?? "unknown"));
}
