import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CommentComposer } from "@v1/ui/recipes/forum/comment-composer";
import { CommentItem } from "@v1/ui/recipes/forum/comment-item";
import { CommentSection } from "@v1/ui/recipes/forum/comment-section";
import { CommentSignInPrompt } from "@v1/ui/recipes/forum/comment-sign-in-prompt";
import { ReactionButtons } from "@v1/ui/recipes/forum/reaction-buttons";
import { expect, fn } from "storybook/test";
import { wordsFor } from "../../words";
import { COMMENTS, StandInEditor } from "./forum.fixtures";

const thread = COMMENTS.map((comment) => (
  <CommentItem
    key={comment.id}
    comment={comment}
    reactions={
      <ReactionButtons
        size="sm"
        likes={2}
        dislikes={0}
        myReaction={null}
        onToggle={fn()}
        likeLabel="Like"
        dislikeLabel="Dislike"
      />
    }
  />
));

const meta = {
  title: "Forum/Comment section",
  component: CommentSection,
  parameters: { layout: "padded" },
  args: {
    count: COMMENTS.length,
    composer: null,
    onCompose: fn(),
    children: thread,
  },
  decorators: [
    (Story) => (
      <div className="max-w-2xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CommentSection>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The thread, and a way to join it. */
export const Thread: Story = {
  play: async ({ args, canvas, globals, userEvent }) => {
    const t = wordsFor(globals).forum.comments;
    await userEvent.click(
      canvas.getByRole("button", { name: t.joinConversation }),
    );
    await expect(args.onCompose).toHaveBeenCalledOnce();
  },
};

/** Writing a comment: the composer takes the join button's place. */
export const Composing: Story = {
  args: {
    composer: (
      <CommentComposer
        editor={<StandInEditor placeholder="Write a comment..." />}
        canSubmit
        pending={false}
        onSubmit={fn()}
        onCancel={fn()}
      />
    ),
  },
};

/** A signed-out reader who wants to comment is asked to sign in. */
export const SignedOut: Story = {
  args: { composer: <CommentSignInPrompt onSignIn={fn()} /> },
};

/** Nobody has commented yet. */
export const NoComments: Story = { args: { count: 0, children: null } };
