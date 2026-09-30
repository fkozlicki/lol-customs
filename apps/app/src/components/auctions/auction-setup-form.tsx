"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AUCTION_POOL_SIZE } from "@v1/domain/auction";
import { riotIdKey } from "@v1/domain/riot-id";
import type { RosterPlayer } from "@v1/domain/shuffle";
import type { AuctionSettings } from "@v1/ui/recipes/auctions/auction-settings";
import { AuctionSetup } from "@v1/ui/recipes/auctions/auction-setup";
import { LiveAuctionNotice } from "@v1/ui/recipes/auctions/live-auction-notice";
import { toast } from "@v1/ui/sonner";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useUser } from "@/components/auth/user-context";
import { usePlayerPicker } from "@/components/player-picker/use-player-picker";
import { useTRPC } from "@/trpc/react";
import { canSubmitAuctionSetup } from "./auction-setup";

interface AuctionSetupFormProps {
  /** The lobby being edited; without one, the form creates a room. */
  roomId?: string;
  initialPlayers?: RosterPlayer[];
  initialBudget?: number;
  initialBidSeconds?: number;
  initialRevealOrder?: boolean;
  onUpdated?: () => void;
  /** Shown beside the save button when the form edits an existing lobby. */
  onCancel?: () => void;
}

/** The pool as one comparable string, so an edit only sends players when the pool changed. */
function poolKey(players: RosterPlayer[]) {
  return players.map(riotIdKey).sort().join("|");
}

/** Creates an auction room, or edits a lobby's pool and rules. */
export function AuctionSetupForm({
  roomId,
  initialPlayers = [],
  initialBudget = 20,
  initialBidSeconds = 30,
  initialRevealOrder = false,
  onUpdated,
  onCancel,
}: AuctionSetupFormProps) {
  const t = useTranslations("dashboard.pages.auctions");
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { profile, isLoading, openSignInDialog } = useUser();
  const mode = roomId ? "edit" : "create";
  const [settings, setSettings] = useState<AuctionSettings>({
    teamName: "Team A",
    budget: initialBudget,
    bidSeconds: initialBidSeconds,
    revealOrder: initialRevealOrder,
  });
  const [initialPoolKey] = useState(() => poolKey(initialPlayers));

  const { data: ladder = [] } = useQuery(trpc.players.all.queryOptions());
  const { data: auctions } = useQuery({
    ...trpc.auctions.listActive.queryOptions(),
    enabled: mode === "create" && Boolean(profile),
  });
  const myAuction =
    mode === "create" ? auctions?.find((auction) => auction.isMine) : undefined;

  const pool = usePlayerPicker({
    ladder,
    size: AUCTION_POOL_SIZE,
    initial: initialPlayers,
    duplicateMessage: t("creator.duplicate"),
    invalidRiotIdMessage: t("creator.invalidRiotId"),
  });

  useEffect(() => {
    if (mode === "create" && !isLoading && !profile) openSignInDialog();
  }, [isLoading, mode, openSignInDialog, profile]);

  const createAuction = useMutation(
    trpc.auctions.create.mutationOptions({
      onSuccess: (room) => {
        void queryClient.invalidateQueries(
          trpc.auctions.listActive.queryOptions(),
        );
        router.push(`/auctions/${room.id}`);
      },
      onError: (error) => toast.error(error.message),
    }),
  );
  const updateLobby = useMutation(
    trpc.auctions.updateLobby.mutationOptions({
      onSuccess: () => {
        toast.success(t("creator.updated"));
        onUpdated?.();
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  function submit() {
    const players = pool.picked.map(({ gameName, tagLine }) => ({
      gameName,
      tagLine,
    }));
    const rules = {
      budget: settings.budget,
      bidSeconds: settings.bidSeconds,
      showOrder: settings.revealOrder,
    };
    if (roomId) {
      updateLobby.mutate({
        id: roomId,
        ...rules,
        ...(poolKey(pool.picked) !== initialPoolKey ? { players } : {}),
      });
    } else {
      createAuction.mutate({ players, teamName: settings.teamName, ...rules });
    }
  }

  if (myAuction?.status === "active") {
    return (
      <LiveAuctionNotice
        onGoToAuction={() => router.push(`/auctions/${myAuction.id}`)}
      />
    );
  }

  return (
    <AuctionSetup
      mode={mode}
      pool={pool.views.picked}
      poolSize={AUCTION_POOL_SIZE}
      candidates={pool.views.candidates}
      search={pool.search}
      onSearchChange={pool.setSearch}
      riotId={pool.riotId}
      onRiotIdChange={pool.setRiotId}
      onAdd={pool.add}
      onAddRiotId={pool.addByRiotId}
      onRemove={pool.remove}
      onClear={pool.clear}
      settings={settings}
      onSettingsChange={setSettings}
      notice={
        myAuction
          ? {
              kind: myAuction.mySide === "A" ? "replaces" : "leaves",
              teamA: myAuction.teamA.teamName,
              teamB: myAuction.teamB.teamName,
            }
          : null
      }
      canSubmit={
        canSubmitAuctionSetup({
          mode,
          poolCount: pool.picked.length,
          settings,
        }) &&
        (mode === "edit" || Boolean(profile))
      }
      pending={createAuction.isPending || updateLobby.isPending}
      onSubmit={submit}
      onCancel={onCancel}
    />
  );
}
