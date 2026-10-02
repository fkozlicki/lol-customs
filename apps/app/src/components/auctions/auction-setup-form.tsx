"use client";

import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { AUCTION_POOL_SIZE } from "@v1/domain/auction";
import { riotIdKey } from "@v1/domain/riot-id";
import type { RosterPlayer } from "@v1/domain/shuffle";
import type { AuctionSettings } from "@v1/ui/recipes/auctions/auction-settings";
import { AuctionSetup } from "@v1/ui/recipes/auctions/auction-setup";
import { toast } from "@v1/ui/sonner";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { type ComponentProps, useState } from "react";
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
  /** What creating does to a lobby the viewer is already in; `NewAuction` works it out. */
  notice?: ComponentProps<typeof AuctionSetup>["notice"];
}

/** The pool as one comparable string, so an edit only sends players when the pool changed. */
function poolKey(players: RosterPlayer[]) {
  return players.map(riotIdKey).sort().join("|");
}

/** Creates an auction room, or edits a lobby's pool and rules. Suspends until the ladder is read. */
export function AuctionSetupForm({
  roomId,
  initialPlayers = [],
  initialBudget = 20,
  initialBidSeconds = 30,
  initialRevealOrder = false,
  onUpdated,
  onCancel,
  notice,
}: AuctionSetupFormProps) {
  const t = useTranslations("dashboard.pages.auctions");
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { profile } = useUser();
  const mode = roomId ? "edit" : "create";
  const [settings, setSettings] = useState<AuctionSettings>({
    teamName: "Team A",
    budget: initialBudget,
    bidSeconds: initialBidSeconds,
    revealOrder: initialRevealOrder,
  });
  const [initialPoolKey] = useState(() => poolKey(initialPlayers));

  const { data: ladder } = useSuspenseQuery(trpc.players.all.queryOptions());

  const pool = usePlayerPicker({
    ladder,
    size: AUCTION_POOL_SIZE,
    initial: initialPlayers,
    duplicateMessage: t("creator.duplicate"),
    invalidRiotIdMessage: t("creator.invalidRiotId"),
  });

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
      notice={notice}
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
