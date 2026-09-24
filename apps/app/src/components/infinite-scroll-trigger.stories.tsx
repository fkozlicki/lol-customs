import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { InfiniteScrollTrigger } from "./infinite-scroll-trigger";

const meta = {
  title: "Infinite scroll trigger",
  component: InfiniteScrollTrigger,
  args: { hasNextPage: true, isFetchingNextPage: true, onLoadMore: () => {} },
} satisfies Meta<typeof InfiniteScrollTrigger>;

export default meta;

/**
 * What shows while the next page loads. Worth knowing: this is a spinner, and DESIGN.md lists
 * "a spinner while data loads" as an anti-pattern — the fix it names is the matching skeleton.
 * The story exists so that is visible rather than buried in a list.
 */
export const Loading: StoryObj<typeof meta> = {};
