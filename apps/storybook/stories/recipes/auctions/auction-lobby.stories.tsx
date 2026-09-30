import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AuctionLobby } from "@v1/ui/recipes/auctions/auction-lobby";
import { expect, fn } from "storybook/test";
import { wordsFor } from "../../words";
import { lobby } from "./auction-room.fixtures";

const meta = {
  title: "Auctions/Lobby",
  component: AuctionLobby,
  parameters: { layout: "padded" },
  args: {
    lobby: lobby(),
    renaming: false,
    busy: { ready: false, seat: false, rename: false, join: false },
    onToggleReady: fn(),
    onRenameStart: fn(),
    onRenameSave: fn(),
    onRenameCancel: fn(),
    onSeatAction: fn(),
    onJoin: fn(),
    onCopyInvite: fn(),
    onEditPool: fn(),
  },
} satisfies Meta<typeof AuctionLobby>;

export default meta;

type Story = StoryObj<typeof meta>;

const creator = lobby({
  teams: {
    A: { ...lobby().teams.A, canRename: true },
    B: { ...lobby().teams.B, vacancy: "invite" },
  },
  ready: { ready: true, allowed: true },
  canEditPool: true,
});

/** A visitor sees the open seat and can take it. */
export const Visitor: Story = {
  play: async ({ args, canvas, globals, userEvent }) => {
    const t = wordsFor(globals).auctions;
    await userEvent.click(canvas.getByRole("button", { name: t.actions.join }));
    await expect(args.onJoin).toHaveBeenCalledOnce();
  },
};

/** The creator waits for a second captain, with the room's link to send, and can edit the pool. */
export const Creator: Story = {
  args: { lobby: creator },
  play: async ({ args, canvas, globals, userEvent }) => {
    const t = wordsFor(globals).auctions;
    await userEvent.click(
      canvas.getByRole("button", { name: t.lobby.copyLink }),
    );
    await expect(args.onCopyInvite).toHaveBeenCalledOnce();
    await userEvent.click(canvas.getByRole("button", { name: t.lobby.edit }));
    await expect(args.onEditPool).toHaveBeenCalledOnce();
    await userEvent.click(
      canvas.getByRole("button", { name: t.actions.unready }),
    );
    await expect(args.onToggleReady).toHaveBeenCalledOnce();
  },
};

/** The creator renaming their team. */
export const Renaming: Story = {
  args: { lobby: creator, renaming: true },
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
    lobby: lobby({
      teams: {
        A: lobby().teams.A,
        B: {
          side: "B",
          teamName: "Pierogi Gang",
          captain: { name: "ola", ready: false },
          canRename: true,
          seatAction: "leave",
          vacancy: "open",
        },
      },
      ready: { ready: false, allowed: true },
    }),
  },
};

/** Both ready: the countdown to the first round. */
export const Countdown: Story = {
  args: {
    lobby: lobby({
      countdown: {
        deadline: new Date(Date.now() + 4_000).toISOString(),
        serverNow: new Date().toISOString(),
        durationSeconds: 5,
      },
      teams: {
        A: lobby().teams.A,
        B: {
          side: "B",
          teamName: "Pierogi Gang",
          captain: { name: "ola", ready: true },
          canRename: false,
          seatAction: null,
          vacancy: "open",
        },
      },
    }),
  },
};
