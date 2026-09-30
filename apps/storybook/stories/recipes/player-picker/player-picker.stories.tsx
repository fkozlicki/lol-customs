import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LadderPicker } from "@v1/ui/recipes/player-picker/ladder-picker";
import { PickedPlayers } from "@v1/ui/recipes/player-picker/picked-players";
import { PickerCount } from "@v1/ui/recipes/player-picker/picker-count";
import { RiotIdField } from "@v1/ui/recipes/player-picker/riot-id-field";
import { PLAYERS } from "./player-picker.fixtures";

const noop = () => {};

/**
 * The parts the draw and the auction setup both pick players with. Their words come from the screen
 * that uses them, so these stories pass placeholder English.
 */
const meta = {
  title: "Player picker",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;

/** How many are picked out of how many are needed; clearing appears once someone is. */
export const Count: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-4">
      <PickerCount count={0} size={8} clearLabel="Clear" onClear={noop} />
      <PickerCount count={5} size={8} clearLabel="Clear" onClear={noop} />
    </div>
  ),
};

/** The picked players, rank beside each name (unranked says so), or a hint while nobody is. */
export const Picked: StoryObj = {
  render: () => (
    <div className="grid max-w-3xl gap-10 md:grid-cols-2">
      <PickedPlayers
        title="Pool"
        emptyHint="Add eight players from the list or by Riot ID."
        removeLabel="Remove"
        players={[]}
        onRemove={noop}
      />
      <PickedPlayers
        title="Pool"
        emptyHint="Add eight players from the list or by Riot ID."
        removeLabel="Remove"
        players={PLAYERS.slice(0, 4)}
        onRemove={noop}
      />
    </div>
  ),
};

/** The ladder by name; a full pick disables every add button. */
export const Ladder: StoryObj = {
  render: () => (
    <div className="grid max-w-3xl gap-10 md:grid-cols-2">
      <LadderPicker
        title="From ladder"
        searchPlaceholder="Search by summoner name…"
        emptyLabel="Everyone is picked."
        noResultsLabel="No players match your search."
        addLabel="Add"
        players={PLAYERS}
        search=""
        onSearchChange={noop}
        onAdd={noop}
        full={false}
      />
      <LadderPicker
        title="From ladder"
        searchPlaceholder="Search by summoner name…"
        emptyLabel="Everyone is picked."
        noResultsLabel="No players match your search."
        addLabel="Add"
        players={PLAYERS}
        search=""
        onSearchChange={noop}
        onAdd={noop}
        full
      />
    </div>
  ),
};

/** A search that matches nobody says so. */
export const LadderNoMatch: StoryObj = {
  render: () => (
    <div className="max-w-sm">
      <LadderPicker
        title="From ladder"
        searchPlaceholder="Search by summoner name…"
        emptyLabel="Everyone is picked."
        noResultsLabel="No players match your search."
        addLabel="Add"
        players={[]}
        search="zed"
        onSearchChange={noop}
        onAdd={noop}
        full={false}
      />
    </div>
  ),
};

/** Someone not on the ladder yet, by Riot ID. */
export const RiotId: StoryObj = {
  render: () => (
    <div className="max-w-sm">
      <RiotIdField
        id="story-riot-id"
        label="Riot ID"
        placeholder="SummonerName#TAG"
        addLabel="Add"
        value="Wren#PL1"
        onChange={noop}
        onAdd={noop}
        disabled={false}
      />
    </div>
  ),
};
