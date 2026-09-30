import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PickerCount } from "@v1/ui/recipes/player-picker/picker-count";
import { expect, fn } from "storybook/test";
import { range } from "../../controls";

/** The player picker's parts take their words from the screen that uses them; these stories use English. */
const meta = {
  title: "Player picker/Count",
  component: PickerCount,
  argTypes: {
    count: range(0, 10),
    size: range(1, 10),
  },
  args: { count: 5, size: 8, clearLabel: "Clear", onClear: fn() },
} satisfies Meta<typeof PickerCount>;

export default meta;

type Story = StoryObj<typeof meta>;

/** How many are picked of how many are needed, and a way to start over. */
export const Picking: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Clear" }));
    await expect(args.onClear).toHaveBeenCalledOnce();
  },
};

/** Nobody picked: nothing to clear. */
export const Empty: Story = {
  args: { count: 0 },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("button")).toBeNull();
  },
};
