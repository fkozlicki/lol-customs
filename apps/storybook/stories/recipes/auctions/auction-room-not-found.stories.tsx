import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AuctionRoomNotFound } from "@v1/ui/recipes/auctions/auction-room-not-found";
import { expect, fn } from "storybook/test";
import { wordsFor } from "../../words";

const meta = {
  title: "Auctions/Room not found",
  component: AuctionRoomNotFound,
  parameters: { layout: "padded" },
  args: { onRetry: fn() },
} satisfies Meta<typeof AuctionRoomNotFound>;

export default meta;

type Story = StoryObj<typeof meta>;

/** No room behind the link, or it could not be read; trying again reads it once more. */
export const NotFound: Story = {
  play: async ({ args, canvas, globals, userEvent }) => {
    const t = wordsFor(globals).auctions.actions;
    await userEvent.click(canvas.getByRole("button", { name: t.retry }));
    await expect(args.onRetry).toHaveBeenCalledOnce();
  },
};
