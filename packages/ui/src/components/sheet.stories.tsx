import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./sheet";

const meta = {
  title: "Components/Sheet",
  component: Sheet,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Sheet>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The app uses it for the overflow menu in the mobile navigation. */
export const Default: Story = {
  render: (args) => (
    <Sheet {...args} defaultOpen>
      <SheetTrigger asChild>
        <Button variant="outline">More</Button>
      </SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle className="label-caps">More</SheetTitle>
          <SheetDescription>Everything not in the bottom bar.</SheetDescription>
        </SheetHeader>
        <nav className="grid gap-1 p-4">
          {["Hall of Fame", "Shuffle", "Auctions", "Forum"].map((item) => (
            <span key={item} className="label-caps py-2 text-foreground">
              {item}
            </span>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  ),
};

export const FromTheSide: Story = {
  render: (args) => (
    <Sheet {...args} defaultOpen>
      <SheetTrigger asChild>
        <Button variant="outline">Open</Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle className="label-caps">Filters</SheetTitle>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  ),
};
