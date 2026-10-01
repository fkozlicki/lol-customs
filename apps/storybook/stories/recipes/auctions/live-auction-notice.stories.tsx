import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LiveAuctionNotice } from "@v1/ui/recipes/auctions/live-auction-notice";
import { expect, fn } from "storybook/test";
import { wordsFor } from "../../words";

const meta = {
  title: "Auctions/Live auction notice",
  component: LiveAuctionNotice,
  parameters: { layout: "padded" },
  args: { onGoToAuction: fn() },
} satisfies Meta<typeof LiveAuctionNotice>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Instead of the setup form, for a captain whose auction is live: one at a time. */
export const Live: Story = {
  play: async ({ args, canvas, globals, userEvent }) => {
    const t = wordsFor(globals).auctions.creator;
    await userEvent.click(canvas.getByRole("button", { name: t.goToAuction }));
    await expect(args.onGoToAuction).toHaveBeenCalledOnce();
  },
};
