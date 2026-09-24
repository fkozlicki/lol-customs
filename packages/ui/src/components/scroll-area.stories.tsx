import type { Meta, StoryObj } from "@storybook/react";
import { ScrollArea } from "./scroll-area";

const meta = {
  title: "Components/Scroll area",
  component: ScrollArea,
  parameters: { layout: "centered" },
} satisfies Meta<typeof ScrollArea>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Used where a list has to stay inside a fixed height, like the roster in the shuffle. */
export const Default: Story = {
  render: (args) => (
    <ScrollArea {...args} className="h-56 w-72 border">
      <ul className="divide-y">
        {Array.from({ length: 24 }, (_, i) => (
          <li key={i} className="flex h-12 items-center px-3 text-sm">
            Player {i + 1}
          </li>
        ))}
      </ul>
    </ScrollArea>
  ),
};
