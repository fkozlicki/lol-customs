import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SeasonSelector } from "@v1/ui/recipes/dashboard/season-selector";
import { useState } from "react";
import { SEASONS } from "./season.fixtures";

const meta = {
  title: "Dashboard/Season selector",
  component: SeasonSelector,
  args: {
    seasons: SEASONS,
    allSeasonsValue: "all",
    value: "2",
    onChange: () => {},
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <SeasonSelector {...args} value={value} onChange={setValue} />;
  },
} satisfies Meta<typeof SeasonSelector>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The current season; the menu lists seasons newest first, then all seasons. */
export const CurrentSeason: Story = {};

export const AllSeasons: Story = {
  args: { value: "all" },
};
