import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PlayerHeader } from "@v1/ui/recipes/player/player-header";
import { PlayerSoloRank } from "@v1/ui/recipes/player/player-solo-rank";

const meta = {
  title: "Player/Header",
  component: PlayerHeader,
  parameters: { layout: "padded" },
  args: { name: "Kestrel", tagLine: "EUNE", iconId: 1295 },
} satisfies Meta<typeof PlayerHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The top of a profile, with the Solo/Duo rank Derby Sync last recorded under the name. */
export const Default: Story = {
  args: {
    children: <PlayerSoloRank tier="DIAMOND" rankLabel="diamond IV" />,
  },
};

/** No rank on record: the tag says so in the reader's language. */
export const Unranked: Story = {
  args: { children: <PlayerSoloRank tier={null} rankLabel={null} /> },
};

/** No profile icon either: the initials stand in, square like every avatar. */
export const NoIcon: Story = {
  args: { name: "Nightjar", tagLine: "PL1", iconId: null },
};
