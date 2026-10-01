import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TipTapRenderer } from "@v1/ui/recipes/forum/tiptap-renderer";
import { POSTS } from "./posts.fixtures";

const meta = {
  title: "Forum/Post body",
  component: TipTapRenderer,
  parameters: { layout: "padded" },
  args: { content: POSTS[0]!.body },
} satisfies Meta<typeof TipTapRenderer>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Paragraphs with inline marks. */
export const Prose: Story = {};

/** A heading and a bullet list — the prose plugin's type scale inside the app's. */
export const HeadingAndList: Story = {
  args: { content: POSTS[1]!.body },
};
