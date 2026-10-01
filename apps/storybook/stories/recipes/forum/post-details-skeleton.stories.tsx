import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import PostDetailsSkeleton from "@v1/ui/recipes/forum/post-details-skeleton";

const meta = {
  title: "Forum/Post details skeleton",
  component: PostDetailsSkeleton,
  parameters: { layout: "padded" },
} satisfies Meta<typeof PostDetailsSkeleton>;

export default meta;

/** A post's page while it loads: the title, the author, the body, the thread. */
export const Loading: StoryObj<typeof meta> = {};
