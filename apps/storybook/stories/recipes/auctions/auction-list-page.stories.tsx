import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AuctionListPage } from "@v1/ui/recipes/auctions/auction-list-page";
import { expect, fn } from "storybook/test";
import { wordsFor } from "../../words";
import { AUCTIONS } from "./auction-list.fixtures";

const meta = {
  title: "Auctions/List page",
  component: AuctionListPage,
  parameters: { layout: "fullscreen" },
  args: {
    state: "ready",
    auctions: AUCTIONS,
    connection: "live",
    onCreate: fn(),
    onRetry: fn(),
  },
} satisfies Meta<typeof AuctionListPage>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A live auction, pulsing, with the player on the stage and the price; a lobby waiting for a captain. */
export const Auctions: Story = {
  play: async ({ args, canvas, globals, userEvent }) => {
    const t = wordsFor(globals).auctions.list;
    await userEvent.click(canvas.getByRole("button", { name: t.create }));
    await expect(args.onCreate).toHaveBeenCalledOnce();
  },
};

export const Empty: Story = {
  args: { auctions: [] },
};

export const Loading: Story = {
  args: { state: "loading", connection: "connecting" },
};

/** The list could not be loaded; realtime has fallen back to polling. */
export const LoadFailed: Story = {
  args: { state: "error", connection: "degraded" },
  play: async ({ args, canvas, globals, userEvent }) => {
    const t = wordsFor(globals).auctions.actions;
    await userEvent.click(canvas.getByRole("button", { name: t.retry }));
    await expect(args.onRetry).toHaveBeenCalledOnce();
  },
};
