"use client";

import { useTranslations } from "next-intl";
import { Button } from "../../components/button";
import { Icons } from "../icons";
import { LadderPicker } from "../player-picker/ladder-picker";
import type { PickablePlayerView } from "../player-picker/pickable-player-view";
import { PickedPlayers } from "../player-picker/picked-players";
import { PickerCount } from "../player-picker/picker-count";
import { RiotIdField } from "../player-picker/riot-id-field";
import { AuctionRules } from "./auction-rules";
import type { AuctionSettings } from "./auction-settings";
import { LobbyChangeNotice } from "./lobby-change-notice";

interface AuctionSetupProps {
  /** Creating a room, or editing a lobby's pool and rules. */
  mode: "create" | "edit";
  pool: PickablePlayerView[];
  /** How many players the pool must hold. */
  poolSize: number;
  candidates: PickablePlayerView[];
  search: string;
  onSearchChange: (search: string) => void;
  riotId: string;
  onRiotIdChange: (riotId: string) => void;
  onAdd: (key: string) => void;
  onAddRiotId: () => void;
  onRemove: (key: string) => void;
  onClear: () => void;
  settings: AuctionSettings;
  onSettingsChange: (settings: AuctionSettings) => void;
  /** What creating does to a lobby the viewer is already in. */
  notice?: { kind: "replaces" | "leaves"; teamA: string; teamB: string } | null;
  canSubmit: boolean;
  pending: boolean;
  onSubmit: () => void;
  /** Editing a lobby can be abandoned. */
  onCancel?: () => void;
}

/** The pool of eight a room sells, picked from the ladder or by Riot ID, and the room's rules. */
export function AuctionSetup({
  mode,
  pool,
  poolSize,
  candidates,
  search,
  onSearchChange,
  riotId,
  onRiotIdChange,
  onAdd,
  onAddRiotId,
  onRemove,
  onClear,
  settings,
  onSettingsChange,
  notice,
  canSubmit,
  pending,
  onSubmit,
  onCancel,
}: AuctionSetupProps) {
  const t = useTranslations("auctions");
  const full = pool.length >= poolSize;

  return (
    <div className="space-y-10">
      {notice && <LobbyChangeNotice {...notice} />}

      <div className="flex items-center justify-between gap-4">
        <PickerCount
          count={pool.length}
          size={poolSize}
          clearLabel={t("creator.clear")}
          onClear={onClear}
        />
        <div className="flex gap-2">
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel}>
              {t("lobby.cancelEdit")}
            </Button>
          )}
          <Button
            type="button"
            disabled={!canSubmit || pending}
            onClick={onSubmit}
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

      <div className="grid gap-10 md:grid-cols-2 md:gap-16">
        <PickedPlayers
          title={t("creator.pool")}
          emptyHint={t("creator.poolHint")}
          removeLabel={t("creator.remove")}
          players={pool}
          onRemove={onRemove}
        />
        <section className="space-y-6">
          <LadderPicker
            title={t("creator.addPlayers")}
            searchPlaceholder={t("creator.search")}
            emptyLabel={t("creator.noResults")}
            noResultsLabel={t("creator.noResults")}
            addLabel={t("creator.add")}
            players={candidates}
            search={search}
            onSearchChange={onSearchChange}
            onAdd={onAdd}
            full={full}
          />
          <RiotIdField
            id="auction-riot-id"
            label={t("creator.manual")}
            placeholder={t("creator.riotIdPlaceholder")}
            addLabel={t("creator.add")}
            value={riotId}
            onChange={onRiotIdChange}
            onAdd={onAddRiotId}
            disabled={full}
          />
        </section>
      </div>

      <AuctionRules
        settings={settings}
        onChange={onSettingsChange}
        askTeamName={mode === "create"}
      />
    </div>
  );
}
