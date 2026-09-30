import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DrawBoard } from "@v1/ui/recipes/draw/draw-board";
import { expect, fn } from "storybook/test";
import { wordsFor } from "../../words";
import { PLAYERS, TEAMS } from "./draw.fixtures";

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
    onSearchChange: fn(),
    riotId: "",
    onRiotIdChange: fn(),
    onAdd: fn(),
    onAddRiotId: fn(),
    onRemove: fn(),
    onClear: fn(),
    onDraw: fn(),
  },
} satisfies Meta<typeof DrawBoard>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Nobody on the roster yet: the hint in both columns, the draw button waiting. */
export const Empty: Story = {
  play: async ({ args, canvas, globals, userEvent }) => {
    const t = wordsFor(globals).draw;
    await expect(
      canvas.getByRole("button", { name: t.generate }),
    ).toBeDisabled();
    await userEvent.click(
      canvas.getAllByRole("button", { name: t.addPlayer })[0]!,
    );
    await expect(args.onAdd).toHaveBeenCalledWith(PLAYERS[0]!.key);
  },
};

/** A full roster: the ladder's add buttons disable and the draw button wakes up. */
export const Full: Story = {
  args: { roster: PLAYERS.slice(0, 10), candidates: PLAYERS.slice(10) },
  play: async ({ args, canvas, globals, userEvent }) => {
    const t = wordsFor(globals).draw;
    await userEvent.click(canvas.getByRole("button", { name: t.generate }));
    await expect(args.onDraw).toHaveBeenCalledOnce();
    await userEvent.click(
      canvas.getAllByRole("button", { name: t.removePlayer })[0]!,
    );
    await expect(args.onRemove).toHaveBeenCalledWith(PLAYERS[0]!.key);
  },
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
