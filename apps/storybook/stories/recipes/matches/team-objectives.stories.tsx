import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TeamObjectives } from "@v1/ui/recipes/matches/team-objectives";

const blue = {
  baronKills: 0,
  dragonKills: 3,
  heraldKills: 1,
  inhibitorKills: 1,
  towerKills: 7,
};
const red = {
  baronKills: 2,
  dragonKills: 2,
  heraldKills: 0,
  inhibitorKills: 0,
  towerKills: 7,
};

const meta = {
  title: "Matches/Team objectives",
  component: TeamObjectives,
  args: { ...blue, teamName: "blue" },
} satisfies Meta<typeof TeamObjectives>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Blue: Story = {};

/** The red side mirrors: right-aligned so the two sides face each other across the match. */
export const Red: Story = {
  args: { ...red, teamName: "red", align: "right" },
};

export const Facing: Story = {
  render: () => (
    <div className="flex w-[36rem] justify-between">
      <TeamObjectives {...blue} teamName="blue" />
      <TeamObjectives {...red} teamName="red" align="right" />
    </div>
  ),
};
