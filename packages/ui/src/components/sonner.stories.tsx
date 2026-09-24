import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./button";
import { Toaster, toast } from "./sonner";

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
