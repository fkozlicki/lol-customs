import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MATCH } from "./match.fixtures";
import { TeamObjectives } from "./team-objectives";

type Team = (typeof MATCH.teams)[number];

// The fixture always has both sides; the index type just cannot know that.
const blue = MATCH.teams[0] as Team;
const red = MATCH.teams[1] as Team;

const objectives = (team: Team) => ({
  baronKills: team.baron_kills,
  dragonKills: team.dragon_kills,
  heraldKills: team.rift_herald_kills,
  inhibitorKills: team.inhibitor_kills,
  towerKills: team.tower_kills,
});

const meta = {
  title: "Matches/Team objectives",
  component: TeamObjectives,
  args: { ...objectives(blue), teamName: "blue" },
} satisfies Meta<typeof TeamObjectives>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Blue: Story = {};

/** The red side mirrors: right-aligned so the two sides face each other across the match. */
export const Red: Story = {
  args: { ...objectives(red), teamName: "red", align: "right" },
};

export const Facing: Story = {
  render: () => (
    <div className="flex w-[36rem] justify-between">
      <TeamObjectives {...objectives(blue)} teamName="blue" />
      <TeamObjectives {...objectives(red)} teamName="red" align="right" />
    </div>
  ),
};
