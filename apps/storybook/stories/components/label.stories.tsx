import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Label } from "@v1/ui/label";

const meta = {
  title: "Components/Label",
  component: Label,
  args: { children: "Nickname" },
} satisfies Meta<typeof Label>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** In Derby a form label takes `label-caps`; the bare component is the accessibility wiring. */
export const AsUsedHere: Story = {
  args: { className: "label-caps", children: "Nickname" },
};
