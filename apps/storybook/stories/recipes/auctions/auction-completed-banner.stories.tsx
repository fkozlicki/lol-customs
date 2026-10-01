import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AuctionCompletedBanner } from "@v1/ui/recipes/auctions/auction-completed-banner";

/** Above a finished auction's final rosters. */
const meta = {
  title: "Auctions/Completed banner",
  component: AuctionCompletedBanner,
  parameters: { layout: "padded" },
} satisfies Meta<typeof AuctionCompletedBanner>;

export default meta;

export const Completed: StoryObj<typeof meta> = {};
