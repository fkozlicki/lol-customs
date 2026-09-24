import type { Meta, StoryObj } from "@storybook/react";
import { Skeleton } from "./skeleton";

const meta = {
  title: "Components/Skeleton",
  component: Skeleton,
} satisfies Meta<typeof Skeleton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { className: "h-8 w-56" },
};

/**
 * DESIGN.md: a skeleton is shaped like the view it stands in for, not a stack of generic grey
 * blocks — otherwise the layout visibly jumps when the data lands.
 */
export const ShapedLikeTheView: Story = {
  render: () => (
    <div className="w-80 space-y-2">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-9 w-56 sm:h-14 sm:w-80" />
      <Skeleton className="h-4 w-64" />
    </div>
  ),
};
