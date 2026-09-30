import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PlayerTitles } from "@v1/ui/recipes/player/player-titles";
import { TITLES } from "./player.fixtures";

const meta = {
  title: "Player/Titles",
  component: PlayerTitles,
  parameters: { layout: "padded" },
  args: { titles: TITLES },
} satisfies Meta<typeof PlayerTitles>;

export default meta;

/**
 * Hall of Fame titles the player holds. MVP and ACE take their colour; a worst title is dashed. With
 * none, nothing renders.
 */
export const Default: StoryObj<typeof meta> = {};
