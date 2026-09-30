import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AuctionListSkeleton } from "@v1/ui/recipes/auctions/auction-list-skeleton";

const meta = {
  title: "Auctions/List skeleton",
  component: AuctionListSkeleton,
  parameters: { layout: "padded" },
} satisfies Meta<typeof AuctionListSkeleton>;

export default meta;

/** The list of rooms while it loads, shaped like two of them. */
export const Loading: StoryObj<typeof meta> = {};
