import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PlayerSeasonEmpty } from "./player-season-empty";

const meta = {
  title: "Player/Season empty",
  component: PlayerSeasonEmpty,
  parameters: { layout: "padded" },
  args: { seasonNumber: 2 },
} satisfies Meta<typeof PlayerSeasonEmpty>;

export default meta;

/**
 * A profile opened on a season the player has not played in. Left-aligned and unboxed, like every
 * empty state in the app — compare with Design system › Components › Empty.
 */
export const Default: StoryObj<typeof meta> = {};
