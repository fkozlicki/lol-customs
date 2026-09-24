import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { POSTS } from "./posts.fixtures";
import { TipTapRenderer } from "./tiptap-renderer";

const meta = {
  title: "Forum/Post body",
  component: TipTapRenderer,
  parameters: { layout: "padded" },
  args: { content: POSTS[0]!.content as Record<string, unknown> },
} satisfies Meta<typeof TipTapRenderer>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Paragraphs with inline marks. */
export const Prose: Story = {};

/** A heading and a bullet list — the prose plugin's type scale inside the app's. */
export const HeadingAndList: Story = {
  args: { content: POSTS[1]!.content as Record<string, unknown> },
};
