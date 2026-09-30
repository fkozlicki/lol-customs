import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PostComposer } from "@v1/ui/recipes/forum/post-composer";
import { expect, fn } from "storybook/test";
import { wordsFor } from "../../words";
import { StandInEditor } from "./forum.fixtures";

const meta = {
  title: "Forum/New post",
  component: PostComposer,
  parameters: { layout: "padded" },
  args: {
    titleInput: { name: "title" },
    editor: <StandInEditor placeholder="Write your post..." />,
    pending: false,
    // A real submit would reload the story; the form's own handler does the rest in the app.
    onSubmit: fn((event) => event.preventDefault()),
    backHref: "/posts",
  },
} satisfies Meta<typeof PostComposer>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A blank post: the title set large, the editor below; publishing sends the form. */
export const Blank: Story = {
  play: async ({ args, canvas, globals, userEvent }) => {
    const t = wordsFor(globals).forum.composer;
    await userEvent.click(canvas.getByRole("button", { name: t.publish }));
    await expect(args.onSubmit).toHaveBeenCalledOnce();
  },
};

/** Sent without a title. */
export const MissingTitle: Story = {
  args: { titleError: "Give your post a title." },
};

/** While the post is being published. */
export const Publishing: Story = {
  args: {
    titleInput: { name: "title", defaultValue: "Baron o 45. minucie" },
    pending: true,
  },
};
