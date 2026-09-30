import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CommentItem } from "@v1/ui/recipes/forum/comment-item";
import { CommentSection } from "@v1/ui/recipes/forum/comment-section";
import { PostArticle } from "@v1/ui/recipes/forum/post-article";
import { ReactionButtons } from "@v1/ui/recipes/forum/reaction-buttons";
import { fn } from "storybook/test";
import { COMMENTS } from "./forum.fixtures";
import { POSTS } from "./posts.fixtures";

const [post] = POSTS;

const reactions = (likes: number, dislikes: number, size?: "sm") => (
  <ReactionButtons
    size={size}
    likes={likes}
    dislikes={dislikes}
    myReaction="like"
    onToggle={fn()}
    likeLabel="Like"
    dislikeLabel="Dislike"
  />
);

const meta = {
  title: "Forum/Post article",
  component: PostArticle,
  parameters: { layout: "padded" },
  args: {
    post: {
      title: post!.title,
      authorName: post!.authorName,
      avatarUrl: post!.avatarUrl,
      createdAt: post!.createdAt,
      content: post!.body,
    },
    backHref: "/posts",
    reactions: reactions(post!.likes, post!.dislikes),
    comments: (
      <CommentSection count={COMMENTS.length} composer={null} onCompose={fn()}>
        {COMMENTS.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            reactions={reactions(2, 0, "sm")}
          />
        ))}
      </CommentSection>
    ),
  },
  decorators: [
    (Story) => (
      <div className="max-w-2xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PostArticle>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A post on its own page: title, author, body, reactions, then the thread. */
export const Post: Story = {};

/** A post with an empty body and an author who could not be found, who is called unknown. */
export const Bare: Story = {
  args: {
    post: {
      title: "Kto gra w piątek?",
      authorName: null,
      avatarUrl: null,
      createdAt: post!.createdAt,
      content: null,
    },
  },
};
