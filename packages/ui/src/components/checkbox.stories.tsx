import type { Meta, StoryObj } from "@storybook/react";
import { Checkbox } from "./checkbox";
import { Label } from "./label";

const meta = {
  title: "Components/Checkbox",
  component: Checkbox,
} satisfies Meta<typeof Checkbox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Checked: Story = { args: { defaultChecked: true } };

export const Disabled: Story = { args: { disabled: true } };

/** A checkbox with a label and a line of description under it. */
export const WithDescription: Story = {
  render: (args) => (
    <div className="flex items-start gap-3">
      <Checkbox {...args} id="terms" defaultChecked />
      <div className="grid gap-1.5">
        <Label htmlFor="terms">Show the full draw order</Label>
        <p className="text-sm text-muted-foreground">
          Spectators and captains see all upcoming players.
        </p>
      </div>
    </div>
  ),
};
