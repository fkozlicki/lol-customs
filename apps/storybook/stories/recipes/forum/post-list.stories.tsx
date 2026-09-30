import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PostList } from "@v1/ui/recipes/forum/post-list";
import { expect, fn } from "storybook/test";
import { wordsFor } from "../../words";
import { POSTS } from "./posts.fixtures";

const meta = {
  title: "Forum/Post list",
  component: PostList,
  parameters: { layout: "padded" },
  args: {
    posts: POSTS,
    onNewPost: fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
    onLoadMore: fn(),
  },
} satisfies Meta<typeof PostList>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The forum: the count, the way to write a post, and the posts. */
export const Posts: Story = {
  play: async ({ args, canvas, globals, userEvent }) => {
    const t = wordsFor(globals).forum;
    await userEvent.click(canvas.getByRole("button", { name: t.newPost }));
    await expect(args.onNewPost).toHaveBeenCalledOnce();
  },
};

/** Scrolled to the end while the next page loads. */
export const LoadingMore: Story = {
  args: { hasNextPage: true, isFetchingNextPage: true },
};

/** No posts yet: an invitation to write the first. */
export const Empty: Story = { args: { posts: [] } };
