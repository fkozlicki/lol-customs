import type { Meta, StoryObj } from "@storybook/react";
import { Separator } from "./separator";

const meta = {
  title: "Components/Separator",
  component: Separator,
} satisfies Meta<typeof Separator>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * DESIGN.md rule 7 groups with hairlines rather than boxes, so this is the shape of most divisions
 * in the app — usually as `border-t` or `divide-y`, and as this component where it needs a role.
 */
export const Horizontal: Story = {
  render: (args) => (
    <div className="w-72 space-y-3">
      <p className="text-sm">Standings</p>
      <Separator {...args} />
      <p className="text-sm">Recent matches</p>
    </div>
  ),
};

/** The vertical rule between groups in a toolbar. */
export const Vertical: Story = {
  render: (args) => (
    <div className="flex h-5 items-center gap-3">
      <span className="label-caps">Bold</span>
      <Separator {...args} orientation="vertical" />
      <span className="label-caps">List</span>
      <Separator {...args} orientation="vertical" />
      <span className="label-caps">Image</span>
    </div>
  ),
};
