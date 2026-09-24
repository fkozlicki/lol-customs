import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TeamObjectives } from "./team-objectives";

const meta = {
  title: "Matches/Team objectives",
  component: TeamObjectives,
  args: {
    baronKills: 0,
    dragonKills: 3,
    heraldKills: 1,
    inhibitorKills: 1,
    towerKills: 7,
    teamName: "blue",
  },
} satisfies Meta<typeof TeamObjectives>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Blue: Story = {};

/** The red side mirrors: right-aligned so the two sides face each other across the match. */
export const Red: Story = {
  args: {
    baronKills: 2,
    dragonKills: 2,
    heraldKills: 0,
    inhibitorKills: 0,
    towerKills: 7,
    teamName: "red",
    align: "right",
  },
};

export const Facing: Story = {
  render: (args) => (
    <div className="flex w-[36rem] justify-between">
      <TeamObjectives {...args} teamName="blue" />
      <TeamObjectives
        {...args}
        teamName="red"
        align="right"
        baronKills={2}
        dragonKills={2}
        heraldKills={0}
        inhibitorKills={0}
      />
    </div>
  ),
};
