import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { HallOfFameSkeleton } from "@v1/ui/recipes/hof/hall-of-fame-skeleton";

const meta = {
  title: "Hall of Fame/Skeleton",
  component: HallOfFameSkeleton,
  parameters: { layout: "padded" },
} satisfies Meta<typeof HallOfFameSkeleton>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
