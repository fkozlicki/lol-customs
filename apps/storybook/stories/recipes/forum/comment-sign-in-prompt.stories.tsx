import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CommentSignInPrompt } from "@v1/ui/recipes/forum/comment-sign-in-prompt";
import { expect, fn } from "storybook/test";
import { wordsFor } from "../../words";

const meta = {
  title: "Forum/Comment sign-in prompt",
  component: CommentSignInPrompt,
  parameters: { layout: "padded" },
  args: { onSignIn: fn() },
} satisfies Meta<typeof CommentSignInPrompt>;

export default meta;

type Story = StoryObj<typeof meta>;

/** In place of the comment form for a signed-out reader. */
export const SignedOut: Story = {
  play: async ({ args, canvas, globals, userEvent }) => {
    const t = wordsFor(globals).forum.comments;
    await userEvent.click(canvas.getByRole("button", { name: t.signIn }));
    await expect(args.onSignIn).toHaveBeenCalledOnce();
  },
};
