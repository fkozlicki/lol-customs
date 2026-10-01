import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DrawSkeleton } from "@v1/ui/recipes/draw/draw-skeleton";

const meta = {
  title: "Draw/Skeleton",
  component: DrawSkeleton,
  parameters: { layout: "padded" },
} satisfies Meta<typeof DrawSkeleton>;

export default meta;

/** The draw while the ladder's players load. */
export const Default: StoryObj<typeof meta> = {};
