import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AuctionSetupSkeleton } from "@v1/ui/recipes/auctions/auction-setup-skeleton";

const meta = {
  title: "Auctions/Setup skeleton",
  component: AuctionSetupSkeleton,
  parameters: { layout: "padded" },
} satisfies Meta<typeof AuctionSetupSkeleton>;

export default meta;

/** The setup form while it loads, on the new-auction page and in a lobby's pool editor. */
export const Loading: StoryObj<typeof meta> = {};
