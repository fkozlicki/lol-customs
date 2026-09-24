import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { WinLoss } from "./win-loss";

const meta = {
  title: "Win–loss",
  component: WinLoss,
  args: { wins: 12, losses: 3 },
} satisfies Meta<typeof WinLoss>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** The record appears at four sizes; the type comes from the caller, the colours never do. */
export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-baseline gap-6">
      <WinLoss {...args} className="text-[11px]" />
      <WinLoss {...args} className="text-xs" />
      <WinLoss {...args} className="text-base font-semibold" />
      <WinLoss {...args} className="text-xl" />
    </div>
  ),
};

/** Nobody has played yet — two zeros, still in their colours, so the row does not change shape. */
export const NoMatches: Story = {
  args: { wins: 0, losses: 0 },
};

/** Missing data reads as zero rather than blanking the row. */
export const Missing: Story = {
  args: { wins: null, losses: null },
};
