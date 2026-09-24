import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";

const meta = {
  title: "Components/Card",
  component: Card,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * DESIGN.md rule 7: a card is for something that is genuinely a separate object, like a match. It is
 * not a container for every block — nested borders make a page read as a spreadsheet.
 */
export const Default: Story = {
  render: (args) => (
    <Card {...args} className="w-96">
      <CardHeader>
        <CardTitle>Season 2</CardTitle>
        <CardDescription>Fourteen matches, nine players.</CardDescription>
        <CardAction>
          <Button variant="ghost" size="sm">
            Open
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="num text-4xl">1017</p>
        <p className="label-caps">Top rating</p>
      </CardContent>
      <CardFooter>
        <p className="label-caps">Updated 2 hours ago</p>
      </CardFooter>
    </Card>
  ),
};

/** Corners are square: the radius tokens are `0`, so a card is a rectangle with a hairline. */
export const Minimal: Story = {
  render: (args) => (
    <Card {...args} className="w-72">
      <CardContent>
        <p className="text-sm">Just a surface with a border.</p>
      </CardContent>
    </Card>
  ),
};
