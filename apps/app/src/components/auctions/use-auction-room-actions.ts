"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@v1/ui/sonner";
import { useTRPC } from "@/trpc/react";
import { useAuctionLive } from "./auction-live";

/**
 * Everything a viewer can do in a room, as mutations. Each one reads the room again when it lands,
 * through the page's `AuctionLive`; a refusal is toasted and the room read again too, since it
 * usually means the room moved on. Calling the room off is `CancelAuctionButton`'s.
 */
export function useAuctionRoomActions(roomId: string) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { refresh } = useAuctionLive();
  const id = { id: roomId };

  const failed = (error: { message: string }) => {
    toast.error(error.message);
    refresh();
  };
  const settled = { onSuccess: refresh, onError: failed };
  // Who captains which lobby shows on the auction list, so a change there reaches it too.
  const captainsChanged = {
    onSuccess: () => {
      refresh();
      void queryClient.invalidateQueries(
        trpc.auctions.listActive.queryOptions(),
      );
    },
    onError: failed,
  };

  const bid = useMutation(trpc.auctions.bid.mutationOptions(settled));
  const concede = useMutation(trpc.auctions.concede.mutationOptions(settled));
  const pass = useMutation(trpc.auctions.pass.mutationOptions(settled));
  const take = useMutation(trpc.auctions.take.mutationOptions(settled));
  const ready = useMutation(trpc.auctions.setReady.mutationOptions(settled));
  const rename = useMutation(
    trpc.auctions.updateLobby.mutationOptions(settled),
  );
  const join = useMutation(
    trpc.auctions.joinCaptain.mutationOptions(captainsChanged),
  );
  const leave = useMutation(
    trpc.auctions.leaveCaptain.mutationOptions(captainsChanged),
  );
  const removeCaptain = useMutation(
    trpc.auctions.removeCaptain.mutationOptions(captainsChanged),
  );
  return {
    bid: (amount: number) => bid.mutate({ ...id, amount }),
    concede: () => concede.mutate(id),
    pass: () => pass.mutate(id),
    take: () => take.mutate(id),
    /** A bid, a concession, a pass or a take is on its way. */
    bidding:
      bid.isPending || concede.isPending || pass.isPending || take.isPending,
    setReady: (value: boolean) => ready.mutate({ ...id, ready: value }),
    readying: ready.isPending,
    rename: (teamName: string, options?: { onSuccess?: () => void }) =>
      rename.mutate({ ...id, teamName }, options),
    renaming: rename.isPending,
    join: (teamName: string) => join.mutate({ ...id, teamName }),
    joining: join.isPending,
    leave: () => leave.mutate(id),
    removeCaptain: () => removeCaptain.mutate(id),
    seatChanging: leave.isPending || removeCaptain.isPending,
  };
}
