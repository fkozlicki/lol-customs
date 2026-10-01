import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ConnectionBadge } from "@v1/ui/recipes/auctions/connection-badge";

/**
 * Shown on the auction list and in a room. Live means realtime is connected; polling means it dropped
 * and the page is refetching on a timer; connecting pulses until one of them wins.
 */
const meta = {
  title: "Auctions/Connection badge",
  component: ConnectionBadge,
  args: { state: "live" },
} satisfies Meta<typeof ConnectionBadge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Live: Story = {};

export const Polling: Story = { args: { state: "degraded" } };

export const Connecting: Story = { args: { state: "connecting" } };
