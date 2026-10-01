import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PageHeaderSkeleton } from "@v1/ui/recipes/page-header-skeleton";

const meta = {
  title: "Page header skeleton",
  component: PageHeaderSkeleton,
  parameters: { layout: "padded" },
  args: { eyebrow: true },
} satisfies Meta<typeof PageHeaderSkeleton>;

export default meta;

/** Stands in for a page header while the page loads, eyebrow included where the page has one. */
export const Loading: StoryObj<typeof meta> = {};
