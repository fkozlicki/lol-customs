import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PostComposer } from "@v1/ui/recipes/forum/post-composer";
import { RichTextFrame } from "@v1/ui/recipes/forum/rich-text-frame";

const noop = () => {};

/** The editor as the app renders it, minus TipTap: its toolbar over an empty surface. */
const editor = (
  <RichTextFrame
    active={{
      bold: false,
      italic: false,
      heading: true,
      bulletList: false,
      orderedList: false,
    }}
    onToggle={noop}
    onInsertImage={noop}
  >
    <div className="min-h-[200px] px-3 py-2 text-sm text-muted-foreground">
      Write your post...
    </div>
  </RichTextFrame>
);

const meta = {
  title: "Forum/New post",
  component: PostComposer,
  parameters: { layout: "padded" },
  args: {
    titleInput: { name: "title" },
    editor,
    pending: false,
    onSubmit: (event) => event.preventDefault(),
    backHref: "/posts",
  },
} satisfies Meta<typeof PostComposer>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A blank post: the title set large, the editor below. */
export const Blank: Story = {};

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
