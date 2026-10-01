import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PlayerSeasonSummaries } from "@v1/ui/recipes/player/player-season-summaries";
import { SEASON_SUMMARIES } from "./player.fixtures";

const meta = {
  title: "Player/Season summaries",
  component: PlayerSeasonSummaries,
  parameters: { layout: "padded" },
  args: { summaries: SEASON_SUMMARIES },
  decorators: [
    (Story) => (
      <div className="max-w-72">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PlayerSeasonSummaries>;

export default meta;

/** Every season the player played, newest first; the one on screen reads in the foreground. */
export const Default: StoryObj<typeof meta> = {};
