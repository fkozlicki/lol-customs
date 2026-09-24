import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MATCH_VIEW } from "./match.fixtures";
import MatchTeam from "./match-team";

const meta = {
  title: "Matches/Match team",
  component: MatchTeam,
  args: { team: MATCH_VIEW.blue, side: "blue" },
} satisfies Meta<typeof MatchTeam>;

export default meta;

type Story = StoryObj<typeof meta>;

/** One side's roster on a collapsed card; the winning side's label is in the foreground. */
export const Blue: Story = {};

export const Red: Story = {
  args: { team: MATCH_VIEW.red, side: "red" },
};

/** On a profile, the profile owner is marked within their side. */
export const WithTheProfileOwner: Story = {
  args: { playerParticipant: MATCH_VIEW.mvp },
};
