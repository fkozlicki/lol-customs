import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Checkbox } from "@v1/ui/checkbox";
import { Label } from "@v1/ui/label";
import { expect, fn } from "storybook/test";

const checkedState = {
  control: "inline-radio" as const,
  options: [false, true, "indeterminate"],
};

const meta = {
  title: "Components/Checkbox",
  component: Checkbox,
  // Radix types these as CheckedState, an alias of `boolean | "indeterminate"` that the panel cannot
  // read, so it would offer a raw object editor; the three states are spelled out instead.
  argTypes: {
    checked: checkedState,
    defaultChecked: checkedState,
  },
  // Alone, a checkbox needs a name; beside a <Label>, as below, the label names it.
  args: { "aria-label": "Show the full draw order", onCheckedChange: fn() },
} satisfies Meta<typeof Checkbox>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Clicking it checks it, and says so. */
export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const box = canvas.getByRole("checkbox");
    await userEvent.click(box);
    await expect(box).toBeChecked();
    await expect(args.onCheckedChange).toHaveBeenCalledWith(true);
  },
};

export const Checked: Story = { args: { defaultChecked: true } };

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("checkbox"));
    await expect(args.onCheckedChange).not.toHaveBeenCalled();
  },
};

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
