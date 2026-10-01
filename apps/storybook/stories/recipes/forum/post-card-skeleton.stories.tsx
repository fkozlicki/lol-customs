import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PostCardSkeleton } from "@v1/ui/recipes/forum/post-card-skeleton";

const meta = {
  title: "Forum/Post card skeleton",
  component: PostCardSkeleton,
  parameters: { layout: "padded" },
} satisfies Meta<typeof PostCardSkeleton>;

export default meta;

/** One row: what the list grows by while its next page loads. */
export const Loading: StoryObj<typeof meta> = {};
