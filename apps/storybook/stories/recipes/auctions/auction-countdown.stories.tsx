import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AuctionCountdown } from "@v1/ui/recipes/auctions/auction-countdown";
import type { ComponentProps } from "react";
import { range, slots } from "../../controls";

/** Seconds left, which the panel can slide; the recipe itself takes a deadline and the server's clock. */
type Args = ComponentProps<typeof AuctionCountdown> & { secondsLeft: number };

const meta = {
  title: "Auctions/Countdown",
  component: AuctionCountdown,
  argTypes: {
    secondsLeft: {
      ...range(0, 60),
      description: "Story only: sets the deadline this far ahead.",
    },
    durationSeconds: range(5, 60),
    ...slots("deadline", "serverNow"),
  },
  args: {
    secondsLeft: 24,
    durationSeconds: 30,
    deadline: "",
    serverNow: "",
  },
  render: ({ secondsLeft, ...args }) => {
    const now = Date.now();
    return (
      <AuctionCountdown
        {...args}
        serverNow={new Date(now).toISOString()}
        deadline={new Date(now + secondsLeft * 1000).toISOString()}
      />
    );
  },
} satisfies Meta<Args>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Time left on a bid. It follows the server clock, not the viewer's. */
export const Running: Story = {};

/** The last seconds of a bid. */
export const AlmostOut: Story = { args: { secondsLeft: 4 } };
