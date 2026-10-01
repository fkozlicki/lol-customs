import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CommentComposer } from "@v1/ui/recipes/forum/comment-composer";
import { expect, fn } from "storybook/test";
import { slots } from "../../controls";
import { wordsFor } from "../../words";
import { StandInEditor } from "./forum.fixtures";

const meta = {
  title: "Forum/Comment composer",
  component: CommentComposer,
  argTypes: {
    ...slots("editor"),
  },
  parameters: { layout: "padded" },
  args: {
    editor: <StandInEditor placeholder="Write a comment..." />,
    canSubmit: true,
    pending: false,
    onSubmit: fn(),
    onCancel: fn(),
  },
  decorators: [
    (Story) => (
      <div className="max-w-2xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CommentComposer>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Cancel gives up without posting — it once sat in the form as a submit button — and Post posts. */
export const Writing: Story = {
  play: async ({ args, canvas, globals, userEvent, step }) => {
    const t = wordsFor(globals).forum.comments;
    await step("cancel does not post", async () => {
      await userEvent.click(canvas.getByRole("button", { name: t.cancel }));
      await expect(args.onCancel).toHaveBeenCalledOnce();
      await expect(args.onSubmit).not.toHaveBeenCalled();
    });
    await step("post does", async () => {
      await userEvent.click(canvas.getByRole("button", { name: t.post }));
      await expect(args.onSubmit).toHaveBeenCalledOnce();
    });
  },
};

/** An empty comment cannot be posted. */
export const Empty: Story = {
  args: { canSubmit: false },
  play: async ({ canvas, globals }) => {
    const t = wordsFor(globals).forum.comments;
    await expect(canvas.getByRole("button", { name: t.post })).toBeDisabled();
  },
};

/** While the comment is being posted. */
export const Posting: Story = { args: { pending: true } };
