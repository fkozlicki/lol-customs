import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import LeaderboardHistoryPicker from "./leaderboard-history-picker";

/** Fourteen matches played: the standings can be replayed after 1 … 13, then live. */
const OPTIONS = Array.from({ length: 13 }, (_, index) => index + 1);

const meta = {
  title: "Home/Leaderboard history picker",
  component: LeaderboardHistoryPicker,
  args: { options: OPTIONS, value: null, onChange: () => {} },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return (
      <LeaderboardHistoryPicker {...args} value={value} onChange={setValue} />
    );
  },
} satisfies Meta<typeof LeaderboardHistoryPicker>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Live standings; in the app the choice is kept in `?after=`. */
export const Live: Story = {};

/** Viewing the standings as they were after five games. */
export const AfterFiveGames: Story = {
  args: { value: 5 },
};
