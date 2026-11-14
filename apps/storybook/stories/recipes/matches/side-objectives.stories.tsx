import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SideObjectives } from "@v1/ui/recipes/matches/side-objectives";

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
  title: "Matches/Side objectives",
  component: SideObjectives,
  args: { ...blue, side: "blue" },
} satisfies Meta<typeof SideObjectives>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Blue: Story = {};

/** The red side mirrors: right-aligned so the two sides face each other across the match. */
export const Red: Story = {
  args: { ...red, side: "red", align: "right" },
};

export const Facing: Story = {
  render: () => (
    <div className="flex w-[36rem] justify-between">
      <SideObjectives {...blue} side="blue" />
      <SideObjectives {...red} side="red" align="right" />
    </div>
  ),
};
