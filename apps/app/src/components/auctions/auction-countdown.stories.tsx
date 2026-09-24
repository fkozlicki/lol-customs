import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AuctionCountdown } from "./auction-countdown";

const now = new Date().toISOString();
const inSeconds = (s: number) => new Date(Date.now() + s * 1000).toISOString();

const meta = {
  title: "Auctions/Countdown",
  component: AuctionCountdown,
  args: { serverNow: now, deadline: inSeconds(24), durationSeconds: 30 },
} satisfies Meta<typeof AuctionCountdown>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Time left on a bid. It follows the server clock, not the viewer's. */
export const Running: Story = {};

/** The last seconds of a bid. */
export const AlmostOut: Story = {
  args: { deadline: inSeconds(4) },
};
