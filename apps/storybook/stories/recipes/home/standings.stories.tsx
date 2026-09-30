import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DownloadAppButton } from "@v1/ui/recipes/dashboard/download-app-button";
import LeaderboardHistoryPicker from "@v1/ui/recipes/home/leaderboard-history-picker";
import { Standings } from "@v1/ui/recipes/home/standings";
import { fn } from "storybook/test";
import { range, slots } from "../../controls";
import { QUALIFICATION_MATCHES, STANDINGS } from "./standings.fixtures";

const meta = {
  title: "Home/Standings",
  component: Standings,
  argTypes: {
    ...slots("historyPicker", "emptyAction"),
    qualificationMatches: range(1, 20),
  },
  parameters: { layout: "padded" },
  args: {
    seasonTitle: "Season 2",
    rows: STANDINGS,
    qualificationMatches: QUALIFICATION_MATCHES,
    historyPicker: (
      <LeaderboardHistoryPicker
        options={Array.from({ length: 13 }, (_, i) => i + 1)}
        value={null}
        onChange={fn()}
      />
    ),
  },
} satisfies Meta<typeof Standings>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The home page: the season as its title, the podium, the history picker and the table. */
export const Default: Story = {};

/** A season without matches: the table gives way to a line and the Derby Sync download. */
export const NoMatchesYet: Story = {
  args: {
    rows: [],
    historyPicker: undefined,
    emptyAction: <DownloadAppButton onClick={fn()} />,
  },
};
