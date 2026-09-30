import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DrawBoard } from "@v1/ui/recipes/draw/draw-board";
import { PLAYERS, TEAMS } from "./draw.fixtures";

const noop = () => {};

const meta = {
  title: "Draw/Board",
  component: DrawBoard,
  parameters: { layout: "padded" },
  args: {
    teams: null,
    roster: [],
    size: 10,
    candidates: PLAYERS,
    search: "",
    onSearchChange: noop,
    riotId: "",
    onRiotIdChange: noop,
    onAdd: noop,
    onAddRiotId: noop,
    onRemove: noop,
    onClear: noop,
    onDraw: noop,
  },
} satisfies Meta<typeof DrawBoard>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Nobody on the roster yet: the hint in both columns, the draw button waiting. */
export const Empty: Story = {};

/** A full roster: the ladder's add buttons disable and the draw button wakes up. */
export const Full: Story = {
  args: { roster: PLAYERS.slice(0, 10), candidates: PLAYERS.slice(10) },
};

/** After a draw: the two teams on top, each with its average rank, roles and captain. */
export const Drawn: Story = {
  args: {
    roster: PLAYERS.slice(0, 10),
    candidates: PLAYERS.slice(10),
    teams: TEAMS,
  },
};

/** A search with no match says so rather than showing an empty list. */
export const NoMatch: Story = {
  args: { search: "zed", candidates: [] },
};
