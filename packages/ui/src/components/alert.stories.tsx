import type { Meta, StoryObj } from "@storybook/react";
import { Alert, AlertDescription, AlertTitle } from "./alert";
import { Icons } from "./icons";

const meta = {
  title: "Components/Alert",
  component: Alert,
} satisfies Meta<typeof Alert>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Alert {...args} className="max-w-md">
      <Icons.HelpCircle className="size-4" />
      <AlertTitle>Derby Sync is out of date</AlertTitle>
      <AlertDescription>
        Matches uploaded from this version may be missing rank data.
      </AlertDescription>
    </Alert>
  ),
};

/** Destructive tints the text, not the surface — the card background stays the card background. */
export const Destructive: Story = {
  render: (args) => (
    <Alert {...args} variant="destructive" className="max-w-md">
      <AlertTitle>Could not reach the League client</AlertTitle>
      <AlertDescription>Start the client and try again.</AlertDescription>
    </Alert>
  ),
};

/** Derby Sync uses it like this: a description on its own, no title and no icon. */
export const DescriptionOnly: Story = {
  render: (args) => (
    <Alert {...args} variant="destructive" className="max-w-md">
      <AlertDescription>
        Choose the League installation folder first.
      </AlertDescription>
    </Alert>
  ),
};
