import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FreeAuctionControls } from "@v1/ui/recipes/auctions/free-auction-controls";
import { expect, fn } from "storybook/test";
import { wordsFor } from "../../words";

const meta = {
  title: "Auctions/Free auction controls",
  component: FreeAuctionControls,
  parameters: { layout: "padded" },
  args: { canDecide: true, busy: false, onTake: fn(), onPass: fn() },
} satisfies Meta<typeof FreeAuctionControls>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The opponent is out of budget: take the player for $1, or pass them over for free. */
export const Deciding: Story = {
  play: async ({ args, canvas, globals, userEvent }) => {
    const t = wordsFor(globals).auctions.actions;
    await userEvent.click(canvas.getByRole("button", { name: t.takeForOne }));
    await expect(args.onTake).toHaveBeenCalledOnce();
    await userEvent.click(canvas.getByRole("button", { name: t.pass }));
    await expect(args.onPass).toHaveBeenCalledOnce();
  },
};

/** The captain with no budget waits for the other to decide. */
export const OutOfBudget: Story = {
  args: { canDecide: false },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("button")).toBeNull();
  },
};
