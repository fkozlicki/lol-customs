import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MATCH, MATCH_VIEW } from "./match.fixtures";
import { MatchMetadata } from "./match-metadata";

const meta = {
  title: "Matches/Match metadata",
  component: MatchMetadata,
  args: { match: MATCH },
} satisfies Meta<typeof MatchMetadata>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Duration and how long ago. Neutral without a participant. */
export const Neutral: Story = {};

/** On a profile it also carries that player's result and rating change. */
export const Won: Story = {
  args: { participant: MATCH_VIEW.mvp },
};

export const Lost: Story = {
  args: { participant: MATCH_VIEW.ace },
};
