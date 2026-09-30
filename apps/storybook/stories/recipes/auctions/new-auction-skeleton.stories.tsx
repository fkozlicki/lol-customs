import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NewAuctionSkeleton } from "@v1/ui/recipes/auctions/new-auction-skeleton";

const meta = {
  title: "Auctions/New auction skeleton",
  component: NewAuctionSkeleton,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof NewAuctionSkeleton>;

export default meta;

/** The new-auction page while it loads. */
export const Loading: StoryObj<typeof meta> = {};
