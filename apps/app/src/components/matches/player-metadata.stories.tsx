import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MATCH_VIEW } from "./match.fixtures";
import { PlayerMetadata } from "./player-metadata";

const { mvp, ace, rawFor, scores, blueKills, redKills } = MATCH_VIEW;

const meta = {
  title: "Matches/Player metadata",
  component: PlayerMetadata,
  args: {
    participant: mvp,
    rawData: rawFor(mvp),
    scores,
    totalKills: mvp.team_id === 100 ? blueKills : redKills,
  },
} satisfies Meta<typeof PlayerMetadata>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The profile owner's part of a card: champion, spells, KDA, OP score, items. */
export const Mvp: Story = {};

export const Ace: Story = {
  args: {
    participant: ace,
    rawData: rawFor(ace),
    totalKills: ace.team_id === 100 ? blueKills : redKills,
  },
};
