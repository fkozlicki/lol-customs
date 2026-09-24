import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MATCH } from "./match.fixtures";
import { MatchStats } from "./match-stats";

const side = (teamId: number) =>
  MATCH.match_participants.filter((p) => p.team_id === teamId);
const sum = (teamId: number, key: "kills" | "gold_earned") =>
  side(teamId).reduce((total, p) => total + (p[key] ?? 0), 0);

const meta = {
  title: "Matches/Match stats",
  component: MatchStats,
  parameters: { layout: "padded" },
  args: {
    blueKills: sum(100, "kills"),
    redKills: sum(200, "kills"),
    blueGold: sum(100, "gold_earned"),
    redGold: sum(200, "gold_earned"),
  },
} satisfies Meta<typeof MatchStats>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The fixture match: a close game, so the bars sit near the middle. */
export const Close: Story = {};

/** A stomp, where the bar makes the gap visible before you read a number. */
export const Stomp: Story = {
  args: { blueKills: 41, redKills: 12, blueGold: 81200, redGold: 58300 },
};
