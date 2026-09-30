import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CommentComposer } from "@v1/ui/recipes/forum/comment-composer";
import { CommentItem } from "@v1/ui/recipes/forum/comment-item";
import { CommentSection } from "@v1/ui/recipes/forum/comment-section";
import { CommentSignInPrompt } from "@v1/ui/recipes/forum/comment-sign-in-prompt";
import { PostArticle } from "@v1/ui/recipes/forum/post-article";
import type { CommentView } from "@v1/ui/recipes/forum/post-view";
import { ReactionButtons } from "@v1/ui/recipes/forum/reaction-buttons";
import { RichTextFrame } from "@v1/ui/recipes/forum/rich-text-frame";
import { POSTS } from "./posts.fixtures";

const noop = () => {};
const [post] = POSTS;

const reactions = (likes: number, dislikes: number, size?: "sm") => (
  <ReactionButtons
    size={size}
    likes={likes}
    dislikes={dislikes}
    myReaction="like"
    onToggle={noop}
    likeLabel="Like"
    dislikeLabel="Dislike"
  />
);

const paragraph = (text: string) => ({
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text }] }],
});

const COMMENTS: CommentView[] = [
  {
    id: "c1",
    authorName: "Old Tom",
    avatarUrl: null,
    createdAt: "2026-09-19T08:10:00Z",
    content: paragraph("Następnym razem biorę go do drużyny, obiecuję."),
  },
  {
    id: "c2",
    authorName: null,
    avatarUrl: null,
    createdAt: "2026-09-19T09:40:00Z",
    content: paragraph("Ten baron to był rzut monetą."),
  },
];

/** The editor as the app renders it, minus TipTap: its toolbar over an empty surface. */
const editor = (
  <RichTextFrame
    active={{
      bold: true,
      italic: false,
      heading: false,
      bulletList: false,
      orderedList: false,
    }}
    onToggle={noop}
    onInsertImage={noop}
  >
    <div className="min-h-[120px] px-3 py-2 text-sm text-muted-foreground">
      Write a comment...
    </div>
  </RichTextFrame>
);

const thread = (composer: React.ReactNode, comments = COMMENTS) => (
  <CommentSection count={comments.length} composer={composer} onCompose={noop}>
    {comments.map((comment) => (
      <CommentItem
        key={comment.id}
        comment={comment}
        reactions={reactions(2, 0, "sm")}
      />
    ))}
  </CommentSection>
);

const meta = {
  title: "Forum/Post",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;

/** A post on its own page, with its thread; an author who could not be found is called unknown. */
export const Post: StoryObj = {
  render: () => (
    <div className="max-w-2xl">
      <PostArticle
        post={{
          title: post!.title,
          authorName: post!.authorName,
          avatarUrl: post!.avatarUrl,
          createdAt: post!.createdAt,
          content: post!.body,
        }}
        backHref="/posts"
        reactions={reactions(post!.likes, post!.dislikes)}
        comments={thread(null)}
      />
    </div>
  ),
};

/** Writing a comment. */
export const Commenting: StoryObj = {
  render: () => (
    <div className="max-w-2xl">
      {thread(
        <CommentComposer
          editor={editor}
          canSubmit
          pending={false}
          onSubmit={noop}
          onCancel={noop}
        />,
      )}
    </div>
  ),
};

/** A signed-out reader who wants to comment is asked to sign in. */
export const SignedOut: StoryObj = {
  render: () => (
    <div className="max-w-2xl">
      {thread(<CommentSignInPrompt onSignIn={noop} />)}
    </div>
  ),
};

/** Nobody has commented yet. */
export const NoComments: StoryObj = {
  render: () => <div className="max-w-2xl">{thread(null, [])}</div>,
};
