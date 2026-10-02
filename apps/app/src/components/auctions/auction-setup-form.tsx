"use client";

import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { AUCTION_POOL_SIZE } from "@v1/domain/auction";
import { riotIdKey } from "@v1/domain/riot-id";
import type { RosterPlayer } from "@v1/domain/shuffle";
import { Button } from "@v1/ui/button";
import { Icons } from "@v1/ui/icons";
import { AuctionRules } from "@v1/ui/recipes/auctions/auction-rules";
import type { AuctionSettings } from "@v1/ui/recipes/auctions/auction-settings";
import { LobbyChangeNotice } from "@v1/ui/recipes/auctions/lobby-change-notice";
import { PickerCount } from "@v1/ui/recipes/player-picker/picker-count";
import { toast } from "@v1/ui/sonner";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { type ComponentProps, useState } from "react";
import { useUser } from "@/components/auth/user-context";
import { PlayerPoolPicker } from "@/components/player-picker/player-pool-picker";
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
  notice?: ComponentProps<typeof LobbyChangeNotice> | null;
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

  const pending = createAuction.isPending || updateLobby.isPending;
  const canSubmit =
    canSubmitAuctionSetup({ mode, poolCount: pool.picked.length, settings }) &&
    (mode === "edit" || Boolean(profile));

  return (
    <div className="space-y-10">
      {notice && <LobbyChangeNotice {...notice} />}

      <div className="flex items-center justify-between gap-4">
        <PickerCount
          count={pool.picked.length}
          size={AUCTION_POOL_SIZE}
          clearLabel={t("creator.clear")}
          onClear={pool.clear}
        />
        <div className="flex gap-2">
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel}>
              {t("creator.cancel")}
            </Button>
          )}
          <Button
            type="button"
            disabled={!canSubmit || pending}
            onClick={submit}
          >
            {pending && <Icons.Loader className="size-4 animate-spin" />}
            {pending
              ? t("creator.saving")
              : mode === "edit"
                ? t("creator.save")
                : t("creator.create")}
          </Button>
        </div>
      </div>

      <PlayerPoolPicker picker={pool} words="dashboard.pages.auctions.picker" />

      <AuctionRules
        settings={settings}
        onChange={setSettings}
        askTeamName={mode === "create"}
      />
    </div>
  );
}
