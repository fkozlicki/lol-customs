import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import PostListSkeleton from "@v1/ui/recipes/forum/post-list-skeleton";

const meta = {
  title: "Forum/Post list skeleton",
  component: PostListSkeleton,
  parameters: { layout: "padded" },
} satisfies Meta<typeof PostListSkeleton>;

export default meta;

/** Compare with Forum › Post list: the cards should land where these rows sit. */
export const Loading: StoryObj<typeof meta> = {};
