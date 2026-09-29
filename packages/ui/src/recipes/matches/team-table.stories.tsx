import type { Meta, StoryObj } from "@storybook/react";
import { Table, TableBody } from "../../components/table";
import { MATCH_CARD, MVP } from "./match.fixtures";
import { TeamRow } from "./team-row";
import TeamTable from "./team-table";

const meta = {
  title: "Matches/Team table",
  component: TeamTable,
  parameters: { layout: "padded" },
  args: { team: MATCH_CARD.blue },
} satisfies Meta<typeof TeamTable>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The winning side: the header reads VICTORY in the win colour, the rows are tinted with it. */
export const Victory: Story = {};

export const Defeat: Story = {
  args: { team: MATCH_CARD.red },
};

/** One row, where the damage bars are scaled against the highest in the whole match. */
export const OneRow: Story = {
  render: () => (
    <Table>
      <TableBody>
        <TeamRow participant={MVP} />
      </TableBody>
    </Table>
  ),
};
