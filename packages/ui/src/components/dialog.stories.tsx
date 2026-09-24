import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";

const meta = {
  title: "Components/Dialog",
  component: Dialog,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Dialog>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Open by default so the scrim is visible. That scrim is `bg-overlay` — a token, because an overlay
 * darkens and neither `foreground` nor `background` does that in both themes.
 */
export const Default: Story = {
  render: (args) => (
    <Dialog {...args} defaultOpen>
      <DialogTrigger asChild>
        <Button variant="outline">Download Derby Sync</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Download Derby Sync</DialogTitle>
          <DialogDescription>Choose the format you prefer.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Button variant="outline" className="w-full">
            Installer (.exe)
          </Button>
          <Button variant="outline" className="w-full">
            ZIP (portable)
          </Button>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

/** Closed, so the trigger is what you see — useful for checking it in a layout. */
export const Closed: Story = {
  render: (args) => (
    <Dialog {...args}>
      <DialogTrigger asChild>
        <Button variant="outline">Open</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nothing here yet</DialogTitle>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  ),
};
