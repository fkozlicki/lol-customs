import type { Meta, StoryObj } from "@storybook/react";
import { Label } from "./label";

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
