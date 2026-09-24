import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PostCardSkeleton } from "./forum/post-list-skeleton";
import { InfiniteScrollTrigger } from "./infinite-scroll-trigger";
import MatchCardSkeleton from "./matches/match-card-skeleton";

const meta = {
  title: "Infinite scroll trigger",
  component: InfiniteScrollTrigger,
  parameters: { layout: "padded" },
  args: {
    hasNextPage: true,
    isFetchingNextPage: true,
    onLoadMore: () => {},
    loading: null,
  },
} satisfies Meta<typeof InfiniteScrollTrigger>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * The next page of matches, loading. The list grows by placeholders shaped like its own cards, so
 * nothing jumps when the real ones land — DESIGN.md's answer to a spinner.
 */
export const Matches: Story = {
  args: {
    loading: (
      <div className="space-y-2">
        <MatchCardSkeleton />
        <MatchCardSkeleton />
        <MatchCardSkeleton />
      </div>
    ),
  },
};

/** The forum's version: post rows, continuing the hairlines of the list above. */
export const Posts: Story = {
  args: {
    loading: (
      <div className="divide-y border-t">
        <PostCardSkeleton />
        <PostCardSkeleton />
      </div>
    ),
  },
};
