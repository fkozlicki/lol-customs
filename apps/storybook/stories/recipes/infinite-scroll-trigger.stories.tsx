import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PostCardSkeleton } from "@v1/ui/recipes/forum/post-card-skeleton";
import { InfiniteScrollTrigger } from "@v1/ui/recipes/infinite-scroll-trigger";
import MatchCardSkeleton from "@v1/ui/recipes/matches/match-card-skeleton";
import { expect, fn, waitFor } from "storybook/test";
import { slots } from "../controls";

const meta = {
  title: "Infinite scroll trigger",
  component: InfiniteScrollTrigger,
  argTypes: {
    ...slots("loading"),
  },
  parameters: { layout: "padded" },
  args: {
    hasNextPage: true,
    isFetchingNextPage: true,
    onLoadMore: fn(),
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

/** In view with another page to fetch: the trigger asks for it, once. */
export const InView: Story = {
  args: { isFetchingNextPage: false },
  play: async ({ args }) => {
    await waitFor(() => expect(args.onLoadMore).toHaveBeenCalledOnce());
  },
};

/** The last page is in: nothing more to ask for. */
export const AtTheEnd: Story = {
  args: { hasNextPage: false, isFetchingNextPage: false },
  play: async ({ args }) => {
    await expect(args.onLoadMore).not.toHaveBeenCalled();
  },
};
