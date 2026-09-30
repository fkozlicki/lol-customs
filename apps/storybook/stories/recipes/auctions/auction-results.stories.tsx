import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AuctionResults } from "@v1/ui/recipes/auctions/auction-results";
import { EVENTS, FINAL_ROSTERS } from "./auction-room.fixtures";

const meta = {
  title: "Auctions/Results",
  component: AuctionResults,
  parameters: { layout: "padded" },
  args: { rosters: FINAL_ROSTERS, events: EVENTS },
} satisfies Meta<typeof AuctionResults>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Every player sold: the final rosters with prices (one came free), and how it went. */
export const Completed: Story = {};
