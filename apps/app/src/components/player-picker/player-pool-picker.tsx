"use client";

import { LadderPicker } from "@v1/ui/recipes/player-picker/ladder-picker";
import { PickedPlayers } from "@v1/ui/recipes/player-picker/picked-players";
import { RiotIdField } from "@v1/ui/recipes/player-picker/riot-id-field";
import { useTranslations } from "next-intl";
import { useId } from "react";
import type { usePlayerPicker } from "./use-player-picker";

interface PlayerPoolPickerProps {
  picker: ReturnType<typeof usePlayerPicker>;
  /** Where its words live: each screen names the pool its own way, under the same keys. */
  words: "dashboard.pages.auctions.picker" | "dashboard.pages.shuffle.picker";
}

/**
 * The players picked so far beside the two ways to add more: from the ladder, or by Riot ID. The
 * auction setup and the draw both build their pool with it.
 */
export function PlayerPoolPicker({ picker, words }: PlayerPoolPickerProps) {
  const t = useTranslations(words);
  const riotIdFieldId = useId();

  return (
    <div className="grid gap-10 md:grid-cols-2 md:gap-16">
      <PickedPlayers
        title={t("title")}
        emptyHint={t("hint")}
        removeLabel={t("remove")}
        players={picker.views.picked}
        onRemove={picker.remove}
      />
      <section className="space-y-6">
        <LadderPicker
          title={t("fromLadder")}
          searchPlaceholder={t("search")}
          emptyLabel={t("empty")}
          noResultsLabel={t("noResults")}
          addLabel={t("add")}
          players={picker.views.candidates}
          search={picker.search}
          onSearchChange={picker.setSearch}
          onAdd={picker.add}
          full={picker.full}
        />
        <RiotIdField
          id={riotIdFieldId}
          label={t("riotIdLabel")}
          placeholder={t("riotIdPlaceholder")}
          addLabel={t("add")}
          value={picker.riotId}
          onChange={picker.setRiotId}
          onAdd={picker.addByRiotId}
          disabled={picker.full}
        />
      </section>
    </div>
  );
}
