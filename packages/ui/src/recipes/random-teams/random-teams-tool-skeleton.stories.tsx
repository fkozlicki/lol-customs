import type { Meta, StoryObj } from "@storybook/react";
import { RandomTeamsToolSkeleton } from "./random-teams-tool-skeleton";

const meta = {
  title: "Shuffle/Skeleton",
  component: RandomTeamsToolSkeleton,
  parameters: { layout: "padded" },
} satisfies Meta<typeof RandomTeamsToolSkeleton>;

export default meta;

/** The shuffle while its player list loads: the roster and the draw, side by side. */
export const Default: StoryObj<typeof meta> = {};
