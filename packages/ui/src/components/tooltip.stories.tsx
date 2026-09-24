import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";

const meta = {
  title: "Components/Tooltip",
  component: Tooltip,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Tooltip>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Open by default, because a tooltip that needs a hover is invisible in a story. */
export const Default: Story = {
  render: (args) => (
    <TooltipProvider>
      <Tooltip {...args} defaultOpen>
        <TooltipTrigger asChild>
          <Button variant="outline">Season 2</Button>
        </TooltipTrigger>
        <TooltipContent>Standings for the current season</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
};
