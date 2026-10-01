"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@v1/ui/button";
import { toast } from "@v1/ui/sonner";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTRPC } from "@/trpc/react";

/** The creator's way to call a room off; the list loses it and the creator lands back on it. */
export function CancelAuctionButton({ roomId }: { roomId: string }) {
  const t = useTranslations("dashboard.pages.auctions");
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const cancel = useMutation(
    trpc.auctions.cancel.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.auctions.listActive.queryOptions(),
        );
        router.push("/auctions");
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  return (
    <Button
      variant="outline"
      disabled={cancel.isPending}
      onClick={() => cancel.mutate({ id: roomId })}
    >
      {t("cancel")}
    </Button>
  );
}
