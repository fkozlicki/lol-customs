import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AuctionSetup } from "@v1/ui/recipes/auctions/auction-setup";
import { PLAYERS } from "../player-picker/player-picker.fixtures";

const noop = () => {};

const meta = {
  title: "Auctions/Setup",
  component: AuctionSetup,
  parameters: { layout: "padded" },
  args: {
    mode: "create",
    pool: [],
    poolSize: 8,
    candidates: PLAYERS,
    search: "",
    onSearchChange: noop,
    riotId: "",
    onRiotIdChange: noop,
    onAdd: noop,
    onAddRiotId: noop,
    onRemove: noop,
    onClear: noop,
    settings: {
      teamName: "Team A",
      budget: 20,
      bidSeconds: 30,
      revealOrder: false,
    },
    onSettingsChange: noop,
    notice: null,
    canSubmit: false,
    pending: false,
    onSubmit: noop,
  },
} satisfies Meta<typeof AuctionSetup>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A new room with an empty pool: the create button waits for eight players. */
export const Create: Story = {};

/** A full pool: the ladder's add buttons disable and the room can be created. */
export const FullPool: Story = {
  args: {
    pool: PLAYERS.slice(0, 8),
    candidates: PLAYERS.slice(8),
    canSubmit: true,
  },
};

/** The creator already captains a lobby; creating another cancels it, and the form says so first. */
export const ReplacesLobby: Story = {
  args: {
    notice: { kind: "replaces", teamA: "Night Owls", teamB: "Team B" },
  },
};

/** Editing a lobby: no team name to ask for, a save button, and a way back. */
export const EditLobby: Story = {
  args: {
    mode: "edit",
    pool: PLAYERS.slice(0, 8),
    candidates: PLAYERS.slice(8),
    settings: {
      teamName: "",
      budget: 30,
      bidSeconds: 20,
      revealOrder: true,
    },
    canSubmit: true,
    onCancel: noop,
  },
};

/** While the room is being created. */
export const Saving: Story = {
  args: {
    pool: PLAYERS.slice(0, 8),
    candidates: PLAYERS.slice(8),
    canSubmit: true,
    pending: true,
  },
};
