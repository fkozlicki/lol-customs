import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AuctionSetup } from "@v1/ui/recipes/auctions/auction-setup";
import { type ComponentProps, useState } from "react";
import { expect, fn } from "storybook/test";
import { wordsFor } from "../../words";
import { PLAYERS } from "../player-picker/player-picker.fixtures";

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
    onSearchChange: fn(),
    riotId: "",
    onRiotIdChange: fn(),
    onAdd: fn(),
    onAddRiotId: fn(),
    onRemove: fn(),
    onClear: fn(),
    settings: {
      teamName: "Team A",
      budget: 20,
      bidSeconds: 30,
      revealOrder: false,
    },
    onSettingsChange: fn(),
    notice: null,
    canSubmit: false,
    pending: false,
    onSubmit: fn(),
  },
  // The fields are controlled, so the story holds their state, as the app's form does. Changing one of
  // them in Controls starts it again from there.
  render: (args) => (
    <StatefulSetup
      key={JSON.stringify([args.search, args.riotId, args.settings])}
      {...args}
    />
  ),
} satisfies Meta<typeof AuctionSetup>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A new room with an empty pool: the create button waits for eight players. */
export const Create: Story = {
  play: async ({ canvas, globals }) => {
    const t = wordsFor(globals).auctions.creator;
    await expect(canvas.getByRole("button", { name: t.create })).toBeDisabled();
  },
};

/** A full pool: the ladder's add buttons disable and the room can be created. */
export const FullPool: Story = {
  args: {
    pool: PLAYERS.slice(0, 8),
    candidates: PLAYERS.slice(8),
    canSubmit: true,
  },
  play: async ({ args, canvas, globals, userEvent, step }) => {
    const t = wordsFor(globals).auctions.creator;
    await step(
      "the ladder's add buttons are off with the pool full",
      async () => {
        for (const add of canvas.getAllByRole("button", { name: t.add })) {
          await expect(add).toBeDisabled();
        }
      },
    );
    await step("a rule change reaches the form", async () => {
      const budget = canvas.getByRole("spinbutton", { name: t.budget });
      await userEvent.clear(budget);
      await userEvent.type(budget, "35");
      await expect(args.onSettingsChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ budget: 35 }),
      );
    });
    await step("the room can be created", async () => {
      await userEvent.click(canvas.getByRole("button", { name: t.create }));
      await expect(args.onSubmit).toHaveBeenCalledOnce();
    });
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
    onCancel: fn(),
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

function StatefulSetup(args: ComponentProps<typeof AuctionSetup>) {
  const [search, setSearch] = useState(args.search);
  const [riotId, setRiotId] = useState(args.riotId);
  const [settings, setSettings] = useState(args.settings);
  return (
    <AuctionSetup
      {...args}
      search={search}
      onSearchChange={(value) => {
        args.onSearchChange(value);
        setSearch(value);
      }}
      riotId={riotId}
      onRiotIdChange={(value) => {
        args.onRiotIdChange(value);
        setRiotId(value);
      }}
      settings={settings}
      onSettingsChange={(value) => {
        args.onSettingsChange(value);
        setSettings(value);
      }}
    />
  );
}
