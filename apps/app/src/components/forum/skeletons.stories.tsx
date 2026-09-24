import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import PostDetailsSkeleton from "./post-details-skeleton";
import PostListSkeleton from "./post-list-skeleton";

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
