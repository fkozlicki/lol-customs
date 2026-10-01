import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LiveAuctionNotice } from "@v1/ui/recipes/auctions/live-auction-notice";
import { expect } from "storybook/test";
import { wordsFor } from "../../words";

const meta = {
  title: "Auctions/Live auction notice",
  component: LiveAuctionNotice,
  parameters: { layout: "padded" },
  args: { href: "/auctions/1" },
} satisfies Meta<typeof LiveAuctionNotice>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Instead of the setup form, for a captain whose auction is live: one at a time. */
export const Live: Story = {
  play: async ({ canvas, globals }) => {
    const t = wordsFor(globals).auctions.creator;
    await expect(
      canvas.getByRole("link", { name: t.goToAuction }),
    ).toHaveAttribute("href", "/auctions/1");
  },
};
