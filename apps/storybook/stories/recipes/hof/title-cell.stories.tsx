import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TitleCell } from "@v1/ui/recipes/hof/title-cell";
import { MVP, TIED, UNHELD } from "./hof.fixtures";

const meta = {
  title: "Hall of Fame/Title cell",
  component: TitleCell,
  parameters: { layout: "padded" },
  args: { title: MVP },
} satisfies Meta<typeof TitleCell>;

export default meta;

type Story = StoryObj<typeof meta>;

/** MVP and ACE titles take their colour, on the name and on the value. */
export const Held: Story = {};

/** Players tied on the value share the title: all names from sm, the first and a count on phones. */
export const Shared: Story = {
  args: { title: TIED },
};

/** A pair's title nobody holds yet keeps its place and says so. */
export const Unheld: Story = {
  args: { title: UNHELD },
};
