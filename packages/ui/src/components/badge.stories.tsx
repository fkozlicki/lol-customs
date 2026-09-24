import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "./badge";

const meta = {
  title: "Components/Badge",
  component: Badge,
  args: { children: "Season 2" },
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** A badge keeps `rounded-full`, which is deliberate: circles and pills stay explicit. */
export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge {...args}>Default</Badge>
      <Badge {...args} variant="secondary">
        Secondary
      </Badge>
      <Badge {...args} variant="outline">
        Outline
      </Badge>
      <Badge {...args} variant="destructive">
        Destructive
      </Badge>
    </div>
  ),
};
