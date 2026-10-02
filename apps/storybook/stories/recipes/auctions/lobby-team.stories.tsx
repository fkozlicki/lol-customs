import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LobbyTeam } from "@v1/ui/recipes/auctions/lobby-team";
import { expect, fn } from "storybook/test";
import { wordsFor } from "../../words";
import { lobby } from "./auction-room.fixtures";

const teams = lobby().teams;

/** One side of a lobby: its name, its captain and whether they are ready, or the open seat. */
const meta = {
  title: "Auctions/Lobby team",
  component: LobbyTeam,
  parameters: { layout: "padded" },
  args: {
    team: teams.A,
    renaming: false,
    busy: { seat: false, rename: false, join: false },
    onRenameStart: fn(),
    onRenameSave: fn(),
    onRenameCancel: fn(),
    onSeatAction: fn(),
    onJoin: fn(),
    onCopyInvite: fn(),
  },
} satisfies Meta<typeof LobbyTeam>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A captain who is ready. */
export const Ready: Story = {};

/** The open seat, seen by a visitor, who can take it. */
export const OpenSeat: Story = {
  args: { team: teams.B },
  play: async ({ args, canvas, globals, userEvent }) => {
    const t = wordsFor(globals).auctions;
    await userEvent.click(canvas.getByRole("button", { name: t.actions.join }));
    await expect(args.onJoin).toHaveBeenCalledOnce();
  },
};

/** The open seat, seen by the creator, who sends the room's link to a second captain. */
export const Invite: Story = {
  args: { team: { ...teams.B, vacancy: "invite" } },
  play: async ({ args, canvas, globals, userEvent }) => {
    const t = wordsFor(globals).auctions.lobby;
    await userEvent.click(canvas.getByRole("button", { name: t.copyLink }));
    await expect(args.onCopyInvite).toHaveBeenCalledOnce();
  },
};

/** The creator renaming their team. */
export const Renaming: Story = {
  args: { team: { ...teams.A, canRename: true }, renaming: true },
  play: async ({ args, canvas, globals, userEvent }) => {
    const t = wordsFor(globals).auctions.lobby;
    const field = canvas.getByRole("textbox", { name: t.teamName });
    await userEvent.clear(field);
    await userEvent.type(field, "Pierogi Gang{Enter}");
    await expect(args.onRenameSave).toHaveBeenLastCalledWith("Pierogi Gang");
  },
};

/** Team B's captain joined but is not ready yet; they can leave their seat. */
export const SecondCaptain: Story = {
  args: {
    team: {
      side: "B",
      teamName: "Pierogi Gang",
      captain: { name: "ola", ready: false },
      canRename: true,
      seatAction: "leave",
      vacancy: "open",
    },
  },
  play: async ({ args, canvas, globals, userEvent }) => {
    const t = wordsFor(globals).auctions.lobby;
    await userEvent.click(canvas.getByRole("button", { name: t.leave }));
    await expect(args.onSeatAction).toHaveBeenCalledOnce();
  },
};
