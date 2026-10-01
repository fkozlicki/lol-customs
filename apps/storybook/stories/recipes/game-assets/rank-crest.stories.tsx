import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RankCrest } from "@v1/ui/recipes/game-assets/rank-crest";
import { range, TIERS, tierControl } from "../../controls";

const meta = {
  title: "Game assets/Rank crest",
  component: RankCrest,
  args: { tier: "GOLD", width: 32, height: 32 },
  argTypes: {
    tier: tierControl,
    width: range(16, 96),
    height: range(16, 96),
  },
} satisfies Meta<typeof RankCrest>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A tier's crest, self-hosted (ADR 0002). */
export const Gold: Story = {};

/** Every tier, plus `null` for a player with no rank on record. */
export const AllTiers: Story = {
  render: (args) => (
    <div className="grid grid-cols-6 gap-4">
      {TIERS.map((tier) => (
        <div key={tier ?? "none"} className="flex flex-col items-center gap-1">
          <RankCrest {...args} tier={tier} />
          <span className="label-caps">{tier ?? "unranked"}</span>
        </div>
      ))}
    </div>
  ),
};
