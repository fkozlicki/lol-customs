import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PlayerRelations } from "@v1/ui/recipes/player/player-relations";
import { NO_RELATIONS, RELATIONS } from "./player.fixtures";

const meta = {
  title: "Player/Relations",
  component: PlayerRelations,
  parameters: { layout: "padded" },
  args: { relations: RELATIONS },
  decorators: [
    (Story) => (
      <div className="max-w-72">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PlayerRelations>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Who a player wins and loses with, and who they beat or struggle against. */
export const Default: Story = {};

/** Too few matches with anyone yet: every row says so rather than disappearing. */
export const NotEnoughMatches: Story = {
  args: { relations: NO_RELATIONS },
};
