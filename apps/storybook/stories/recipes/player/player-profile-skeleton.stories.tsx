import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PlayerProfileSkeleton } from "@v1/ui/recipes/player/player-profile-skeleton";

const meta = {
  title: "Player/Profile skeleton",
  component: PlayerProfileSkeleton,
  parameters: { layout: "padded" },
} satisfies Meta<typeof PlayerProfileSkeleton>;

export default meta;

/** A profile while it loads, shaped like the page it becomes. */
export const Default: StoryObj<typeof meta> = {};
