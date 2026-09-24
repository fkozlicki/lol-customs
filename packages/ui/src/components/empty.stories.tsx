import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "./empty";
import { Icons } from "./icons";

const meta = {
  title: "Components/Empty",
  component: Empty,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Empty>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Nothing in Derby uses this, on purpose. It is centred, boxed and dashed, where the app's empty
 * states are left-aligned inline notes — adopting it would contradict DESIGN.md rule 7 rather than
 * fix a drift. The story exists so that judgement can be re-made by looking rather than by arguing.
 */
export const Default: Story = {
  render: (args) => (
    <Empty {...args} className="w-96 border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icons.Swords />
        </EmptyMedia>
        <EmptyTitle>No matches yet</EmptyTitle>
        <EmptyDescription>
          Upload a custom game with Derby Sync to start the season.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" size="sm">
          Download Derby Sync
        </Button>
      </EmptyContent>
    </Empty>
  ),
};

/** What the app does instead: a left-aligned line under the heading it belongs to. */
export const HowDerbyDoesItInstead: Story = {
  render: () => (
    <div className="w-96 space-y-3">
      <p className="label-caps">Recent matches</p>
      <p className="text-sm text-muted-foreground">
        No matches in this season yet.
      </p>
    </div>
  ),
};
