import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LobbyChangeNotice } from "@v1/ui/recipes/auctions/lobby-change-notice";

/** Above the setup form when the viewer already captains a lobby: one lobby at a time. */
const meta = {
  title: "Auctions/Lobby change notice",
  component: LobbyChangeNotice,
  parameters: { layout: "padded" },
  args: { kind: "replaces", teamA: "Night Owls", teamB: "Team B" },
} satisfies Meta<typeof LobbyChangeNotice>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The viewer created the lobby, so creating another cancels it. */
export const Replaces: Story = {};

/** The viewer joined someone else's lobby, so creating one takes them out of it. */
export const Leaves: Story = {
  args: { kind: "leaves", teamA: "Pierogi Gang", teamB: "Night Owls" },
};
