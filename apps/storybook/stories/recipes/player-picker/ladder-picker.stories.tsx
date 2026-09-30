import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LadderPicker } from "@v1/ui/recipes/player-picker/ladder-picker";
import { expect, fn } from "storybook/test";
import { PLAYERS } from "./player-picker.fixtures";

const meta = {
  title: "Player picker/Ladder picker",
  component: LadderPicker,
  parameters: { layout: "padded" },
  args: {
    title: "From ladder",
    searchPlaceholder: "Search by summoner name…",
    emptyLabel: "Everyone is picked.",
    noResultsLabel: "No players match your search.",
    addLabel: "Add",
    players: PLAYERS,
    search: "",
    onSearchChange: fn(),
    onAdd: fn(),
    full: false,
  },
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LadderPicker>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The ladder by name; adding one hands its key back, and typing hands the search back. */
export const Picking: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getAllByRole("button", { name: "Add" })[2]!);
    await expect(args.onAdd).toHaveBeenCalledWith(PLAYERS[2]!.key);
    await userEvent.type(canvas.getByRole("textbox"), "k");
    await expect(args.onSearchChange).toHaveBeenCalledWith("k");
  },
};

/** A full pick: every add button is off, and the list still scrolls from the keyboard. */
export const Full: Story = {
  args: { full: true },
  play: async ({ canvas }) => {
    for (const add of canvas.getAllByRole("button", { name: "Add" })) {
      await expect(add).toBeDisabled();
    }
  },
};

/** A search that matches nobody says so. */
export const NoMatch: Story = {
  args: { players: [], search: "zed" },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText("No players match your search."),
    ).toBeVisible();
  },
};
