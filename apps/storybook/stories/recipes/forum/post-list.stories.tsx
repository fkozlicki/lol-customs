import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PostList } from "@v1/ui/recipes/forum/post-list";
import { POSTS } from "./posts.fixtures";

const noop = () => {};

const meta = {
  title: "Forum/Post list",
  component: PostList,
  parameters: { layout: "padded" },
  args: {
    posts: POSTS,
    onNewPost: noop,
    hasNextPage: false,
    isFetchingNextPage: false,
    onLoadMore: noop,
  },
} satisfies Meta<typeof PostList>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The forum: the count, the way to write a post, and the posts. */
export const Posts: Story = {};

/** Scrolled to the end while the next page loads. */
export const LoadingMore: Story = {
  args: { hasNextPage: true, isFetchingNextPage: true },
};

/** No posts yet: an invitation to write the first. */
export const Empty: Story = { args: { posts: [] } };
