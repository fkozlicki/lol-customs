import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LobbyPool } from "@v1/ui/recipes/auctions/lobby-pool";
import { expect, fn } from "storybook/test";
import { wordsFor } from "../../words";
import { POOL } from "./auction-room.fixtures";

/** The players a lobby will sell; the creator can open it for editing. */
const meta = {
  title: "Auctions/Lobby pool",
  component: LobbyPool,
  parameters: { layout: "padded" },
  args: { players: POOL },
} satisfies Meta<typeof LobbyPool>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Seen by anyone but the creator. */
export const Pool: Story = {
  play: async ({ canvas, globals }) => {
    const t = wordsFor(globals).auctions.lobby;
    await expect(canvas.queryByRole("button", { name: t.edit })).toBeNull();
  },
};

/** Seen by the creator, who can edit it. */
export const Editable: Story = {
  args: { onEdit: fn() },
  play: async ({ args, canvas, globals, userEvent }) => {
    const t = wordsFor(globals).auctions.lobby;
    await userEvent.click(canvas.getByRole("button", { name: t.edit }));
    await expect(args.onEdit).toHaveBeenCalledOnce();
  },
};
