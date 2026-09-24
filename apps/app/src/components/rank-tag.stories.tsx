import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RankTag } from "./rank-tag";

const meta = {
  title: "Rank tag",
  component: RankTag,
  args: { tier: "GOLD", children: "Gold IV" },
} satisfies Meta<typeof RankTag>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Three crest sizes, one per context: a match row, a profile line, a team heading. */
export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <RankTag {...args} size="sm" />
      <RankTag {...args} size="md" />
      <RankTag {...args} size="lg" />
    </div>
  ),
};

/** The label is the caller's, so the same tag carries a prefix or a suffix without a new variant. */
export const Labels: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <RankTag {...args} />
      <RankTag {...args}>Solo/Duo · Gold IV · 45 LP</RankTag>
      <RankTag {...args} size="lg">
        Avg solo Gold IV
      </RankTag>
    </div>
  ),
};

/** Apex tiers have no division, so the label is the tier alone. */
export const Apex: Story = {
  args: { tier: "CHALLENGER", children: "Challenger" },
};

/** No rank on record: the crest falls back and the label says so. */
export const Unranked: Story = {
  args: { tier: null, children: "Unranked" },
};
