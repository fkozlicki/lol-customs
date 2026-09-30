import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DownloadAppButton } from "@v1/ui/recipes/dashboard/download-app-button";
import { MatchList } from "@v1/ui/recipes/matches/match-list";
import { MATCH_CARD } from "./match.fixtures";

const meta = {
  title: "Matches/Match list",
  component: MatchList,
  parameters: { layout: "padded" },
  args: {
    matches: [0, 1, 2].map((i) => ({ ...MATCH_CARD, id: MATCH_CARD.id + i })),
    hasNextPage: false,
    isFetchingNextPage: false,
    onLoadMore: () => {},
  },
} satisfies Meta<typeof MatchList>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Matches newest first; opening one shows its scoreboard and closes any other. */
export const Matches: Story = {};

/** Scrolled to the end while the next page loads. */
export const LoadingMore: Story = {
  args: { hasNextPage: true, isFetchingNextPage: true },
};

/** A player's history with nothing in it. */
export const Empty: Story = { args: { matches: [] } };

/** The season's list with nothing in it offers the app that records matches. */
export const EmptyWithAction: Story = {
  args: {
    matches: [],
    emptyAction: <DownloadAppButton onClick={() => {}} />,
  },
};
