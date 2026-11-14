import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ParticipantRow } from "@v1/ui/recipes/matches/participant-row";
import SideTable from "@v1/ui/recipes/matches/side-table";
import { Table, TableBody } from "@v1/ui/table";
import { MATCH_CARD, MVP } from "./match.fixtures";

const meta = {
  title: "Matches/Side table",
  component: SideTable,
  parameters: { layout: "padded" },
  args: { view: MATCH_CARD.blue },
} satisfies Meta<typeof SideTable>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The winning side: the header reads VICTORY in the win colour, the rows are tinted with it. */
export const Victory: Story = {};

export const Defeat: Story = {
  args: { view: MATCH_CARD.red },
};

/** One row, where the damage bars are scaled against the highest in the whole match. */
export const OneRow: Story = {
  render: () => (
    <Table>
      <TableBody>
        <ParticipantRow participant={MVP} />
      </TableBody>
    </Table>
  ),
};
