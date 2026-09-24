import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Table, TableBody } from "@v1/ui/table";
import { MATCH, MATCH_VIEW } from "./match.fixtures";
import TeamTable from "./team-table";
import { TeamRow } from "./team-row";

const v = MATCH_VIEW;

const meta = {
  title: "Matches/Team table",
  component: TeamTable,
  parameters: { layout: "padded" },
  args: {
    team: v.blue,
    side: "blue",
    isVictorious: true,
    highestDamageDealt: v.highestDamageDealt,
    highestDamageTaken: v.highestDamageTaken,
    totalKills: v.blueKills,
    duration: MATCH.duration,
    rawJson: MATCH.raw_json,
    scores: v.scores,
  },
} satisfies Meta<typeof TeamTable>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The winning side: the header reads VICTORY in the win colour, the rows are tinted with it. */
export const Victory: Story = {};

export const Defeat: Story = {
  args: {
    team: v.red,
    side: "red",
    isVictorious: false,
    totalKills: v.redKills,
  },
};

/** One row, where the damage bars are scaled against the highest in the whole match. */
export const OneRow: Story = {
  render: () => (
    <Table>
      <TableBody>
        <TeamRow
          p={v.mvp}
          highestDamageDealt={v.highestDamageDealt}
          highestDamageTaken={v.highestDamageTaken}
          totalKills={v.mvp.team_id === 100 ? v.blueKills : v.redKills}
          duration={MATCH.duration}
          rawParticipants={v.raw}
          scores={v.scores}
          isVictorious
        />
      </TableBody>
    </Table>
  ),
};
