import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import LeaderboardRow from "./leaderboard-row";
import { STANDINGS } from "./standings.fixtures";

const meta = {
  title: "Home/Leaderboard row",
  component: LeaderboardRow,
  parameters: { layout: "padded" },
  args: { row: STANDINGS[0], position: 1, index: 0 },
  decorators: [
    (Story) => (
      <table className="w-full">
        <tbody>
          <Story />
        </tbody>
      </table>
    ),
  ],
} satisfies Meta<typeof LeaderboardRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Leader: Story = {};

/** A mid-table row. The record column is `hidden sm:table-cell`, so narrow the canvas to see it go. */
export const MidTable: Story = {
  args: { row: STANDINGS[6], position: 7, index: 6 },
};

/** Still qualifying: no position yet, because standings only rank players past the threshold. */
export const Qualifying: Story = {
  args: {
    row: STANDINGS[STANDINGS.length - 1],
    position: null,
    index: STANDINGS.length - 1,
  },
};

/** The whole table, which is where a row's alignment actually has to hold. */
export const Standings: Story = {
  render: () => (
    <>
      {STANDINGS.map((row, index) => (
        <LeaderboardRow
          key={row.puuid}
          row={row}
          position={row.position}
          index={index}
        />
      ))}
    </>
  ),
};
