import type { Meta, StoryObj } from "@storybook/react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

const meta = {
  title: "Components/Table",
  component: Table,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Table>;

export default meta;

type Story = StoryObj<typeof meta>;

const ROWS = [
  { pos: 1, name: "Sutokopter", rating: 1103, wins: 9, losses: 3 },
  { pos: 2, name: "wobbern", rating: 1064, wins: 8, losses: 4 },
  { pos: 3, name: "jaja klekoczą", rating: 1021, wins: 7, losses: 5 },
  { pos: 4, name: "Patologia", rating: 1017, wins: 4, losses: 2 },
];

/**
 * Headers are `label-caps` and every number is `num`, so digits line up down the column. That is
 * what the table is for here — the standings are a column of numbers first and a list second.
 */
export const Standings: Story = {
  render: (args) => (
    <Table {...args}>
      <TableCaption className="label-caps">Season 2 standings</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="label-caps w-12">#</TableHead>
          <TableHead className="label-caps">Player</TableHead>
          <TableHead className="label-caps text-right">Rating</TableHead>
          <TableHead className="label-caps text-right">Record</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ROWS.map((row) => (
          <TableRow key={row.name}>
            <TableCell className="num text-muted-foreground">
              {row.pos}
            </TableCell>
            <TableCell className="font-medium">{row.name}</TableCell>
            <TableCell className="num text-right">{row.rating}</TableCell>
            <TableCell className="num text-right">
              <span className="text-win">{row.wins}</span>
              <span className="text-muted-foreground">–</span>
              <span className="text-loss">{row.losses}</span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};
