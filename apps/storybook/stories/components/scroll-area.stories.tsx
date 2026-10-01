import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ScrollArea } from "@v1/ui/scroll-area";

const meta = {
  title: "Components/Scroll area",
  component: ScrollArea,
  parameters: { layout: "centered" },
} satisfies Meta<typeof ScrollArea>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Used where a list has to stay inside a fixed height, like the roster in the shuffle. */
export const Default: Story = {
  parameters: {
    a11y: {
      config: {
        // Radix's viewport takes no tabIndex through ScrollArea's props, so a list of plain text cannot
        // be scrolled from the keyboard. Its one consumer, the standings history picker, scrolls
        // buttons, which the keyboard reaches; wrap text in a focusable region if you need that.
        rules: [{ id: "scrollable-region-focusable", enabled: false }],
      },
    },
  },
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
