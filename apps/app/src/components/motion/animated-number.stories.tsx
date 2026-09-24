import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AnimatedNumber } from "./animated-number";

const meta = {
  title: "Motion/Animated number",
  component: AnimatedNumber,
  args: { value: 1017, from: 1000, className: "num text-4xl" },
} satisfies Meta<typeof AnimatedNumber>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Counts up to a rating when it arrives. DESIGN.md rule 8: motion marks arriving data, so this runs
 * once and settles — it never loops. With reduced motion it shows the final value before the first
 * paint; server and client both render `from` first, so hydration matches.
 */
export const Default: Story = {};

export const FromZero: Story = {
  args: { value: 1482, from: 0 },
};
