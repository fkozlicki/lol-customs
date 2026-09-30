import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "@v1/ui/button";
import { Toaster, toast } from "@v1/ui/sonner";
import { expect, screen } from "storybook/test";

const meta = {
  title: "Components/Toast",
  component: Toaster,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Toaster>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * The app mounts one `Toaster` in the root layout with `richColors`. Errors are the common case —
 * a failed reaction, a rejected upload.
 */
export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Error" }));
    await expect(
      await screen.findByText("Could not save your reaction."),
    ).toBeVisible();
  },
  render: (args) => (
    <>
      <Toaster {...args} richColors />
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => toast("Teams drawn")}>
          Plain
        </Button>
        <Button
          variant="outline"
          onClick={() => toast.success("Match uploaded")}
        >
          Success
        </Button>
        <Button
          variant="outline"
          onClick={() => toast.error("Could not save your reaction.")}
        >
          Error
        </Button>
      </div>
    </>
  ),
};
