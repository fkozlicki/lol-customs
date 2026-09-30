import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AuctionListPage } from "@v1/ui/recipes/auctions/auction-list-page";
import { AUCTIONS } from "./auction-list.fixtures";

const meta = {
  title: "Auctions/List page",
  component: AuctionListPage,
  parameters: { layout: "fullscreen" },
  args: {
    state: "ready",
    auctions: AUCTIONS,
    connection: "live",
    onCreate: () => {},
    onRetry: () => {},
  },
} satisfies Meta<typeof AuctionListPage>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A live auction, pulsing, with the player on the stage and the price; a lobby waiting for a captain. */
export const Auctions: Story = {};

export const Empty: Story = {
  args: { auctions: [] },
};

export const Loading: Story = {
  args: { state: "loading", connection: "connecting" },
};

/** The list could not be loaded; realtime has fallen back to polling. */
export const LoadFailed: Story = {
  args: { state: "error", connection: "degraded" },
};
