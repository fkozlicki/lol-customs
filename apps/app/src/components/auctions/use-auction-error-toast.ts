"use client";

import type { TRPCClientErrorLike } from "@trpc/client";
import type { AppRouter } from "@v1/api";
import { toast } from "@v1/ui/sonner";
import { useTranslations } from "next-intl";

/** Toasts a refused auction action in the viewer's language, by the auction rule the API names. */
export function useAuctionErrorToast() {
  const t = useTranslations("dashboard.pages.auctions.errors");
  return (error: TRPCClientErrorLike<AppRouter>) =>
    toast.error(t(error.data?.auctionRule ?? "unknown"));
}
