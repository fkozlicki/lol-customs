import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PostCardSkeleton } from "@v1/ui/recipes/forum/post-card-skeleton";
import PostDetailsSkeleton from "@v1/ui/recipes/forum/post-details-skeleton";
import PostListSkeleton from "@v1/ui/recipes/forum/post-list-skeleton";

const meta = {
  title: "Forum/Skeletons",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;

/** Compare with Forum › Post card › List: the cards should land where these rows sit. */
export const List: StoryObj = {
  render: () => <PostListSkeleton />,
};

export const Post: StoryObj = {
  render: () => <PostDetailsSkeleton />,
};

/** One row: what the list grows by while its next page loads. */
export const Row: StoryObj = {
  render: () => <PostCardSkeleton />,
};
