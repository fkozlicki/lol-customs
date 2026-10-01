import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "@v1/ui/button";
import { SectionHeading } from "@v1/ui/recipes/section-heading";
import { slots } from "../controls";

const meta = {
  title: "Section heading",
  component: SectionHeading,
  argTypes: {
    ...slots("action"),
  },
  parameters: { layout: "padded" },
  args: { children: "Recent matches" },
} satisfies Meta<typeof SectionHeading>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The block heading below a page header — one implementation, not five. */
export const Default: Story = {};

/** With an action on the right. */
export const WithAction: Story = {
  args: {
    children: "Standings",
    action: <Button variant="ghost">See all</Button>,
  },
};
