import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MostPlayedChampions } from "@v1/ui/recipes/player/most-played-champions";
import { CHAMPIONS } from "./player.fixtures";

const meta = {
  title: "Player/Most played champions",
  component: MostPlayedChampions,
  parameters: { layout: "padded" },
  args: { champions: CHAMPIONS },
  decorators: [
    (Story) => (
      <div className="max-w-72">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MostPlayedChampions>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NoMatches: Story = {
  args: { champions: [] },
};
