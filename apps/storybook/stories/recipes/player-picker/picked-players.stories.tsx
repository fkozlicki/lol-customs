import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PickedPlayers } from "@v1/ui/recipes/player-picker/picked-players";
import { expect, fn } from "storybook/test";
import { PLAYERS } from "./player-picker.fixtures";

const meta = {
  title: "Player picker/Picked players",
  component: PickedPlayers,
  parameters: { layout: "padded" },
  args: {
    title: "Pool",
    emptyHint: "Add eight players from the list or by Riot ID.",
    removeLabel: "Remove",
    players: PLAYERS.slice(0, 4),
    onRemove: fn(),
  },
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PickedPlayers>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The picked players, rank beside each name (unranked says so), each one removable. */
export const Picked: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(
      canvas.getAllByRole("button", { name: "Remove" })[1]!,
    );
    await expect(args.onRemove).toHaveBeenCalledWith(PLAYERS[1]!.key);
  },
};

/** A hint while nobody is picked. */
export const Empty: Story = { args: { players: [] } };
