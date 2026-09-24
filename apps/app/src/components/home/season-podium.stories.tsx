import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SeasonPodium } from "./season-podium";
import { STANDINGS } from "./standings.fixtures";

const meta = {
  title: "Home/Season podium",
  component: SeasonPodium,
  parameters: { layout: "padded" },
  args: { rows: STANDINGS },
} satisfies Meta<typeof SeasonPodium>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Visual order is second, first, third — the leader stands in the middle, highest. */
export const Default: Story = {};

/** Early in a season nobody has qualified, and the podium shows its empty steps instead. */
export const NobodyQualified: Story = {
  args: { rows: [] },
};

/** Two qualified players: the third step stays empty rather than the podium changing shape. */
export const TwoQualified: Story = {
  args: { rows: STANDINGS.slice(0, 2) },
};
