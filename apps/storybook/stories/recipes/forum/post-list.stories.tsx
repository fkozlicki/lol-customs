import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "@v1/ui/button";
import { PostList } from "@v1/ui/recipes/forum/post-list";
import { expect, fn } from "storybook/test";
import { slots } from "../../controls";
import { POSTS } from "./posts.fixtures";

/** The app passes its new-post button as `newPostAction` and `emptyAction`; here, stand-ins. */
const meta = {
  title: "Forum/Post list",
  component: PostList,
  argTypes: { ...slots("newPostAction", "emptyAction") },
  parameters: { layout: "padded" },
  args: {
    posts: POSTS,
    newPostAction: (
      <Button variant="outline" size="sm">
        New post
      </Button>
    ),
    emptyAction: <Button variant="outline">New post</Button>,
    hasNextPage: false,
    isFetchingNextPage: false,
    onLoadMore: fn(),
  },
} satisfies Meta<typeof PostList>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The forum: the count, the way to write a post, and the posts. */
export const Posts: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("button", { name: "New post" }),
    ).toBeVisible();
  },
};

/** Scrolled to the end while the next page loads. */
export const LoadingMore: Story = {
  args: { hasNextPage: true, isFetchingNextPage: true },
};

/** No posts yet: an invitation to write the first. */
export const Empty: Story = {
  args: { posts: [] },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("button", { name: "New post" }),
    ).toBeVisible();
  },
};
