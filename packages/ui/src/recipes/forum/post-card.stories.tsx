import type { Meta, StoryObj } from "@storybook/react";
import { PostCard } from "./post-card";
import { POSTS } from "./posts.fixtures";

const meta = {
  title: "Forum/Post card",
  component: PostCard,
  parameters: { layout: "padded" },
  args: { post: POSTS[0]! },
} satisfies Meta<typeof PostCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** A post that opens with a heading and a list; the card shows a plain-text excerpt of it. */
export const StructuredBody: Story = {
  args: { post: POSTS[1]! },
};

/** The author could not be resolved, so the card names them in the reader's language. */
export const UnknownAuthor: Story = {
  args: { post: { ...POSTS[0]!, authorName: null } },
};

/** The forum list: cards separated by hairlines, not boxed. */
export const List: Story = {
  render: () => (
    <div className="max-w-2xl divide-y">
      {POSTS.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  ),
};
