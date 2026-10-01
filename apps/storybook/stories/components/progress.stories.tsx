import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Progress } from "@v1/ui/progress";

const meta = {
  title: "Components/Progress",
  component: Progress,
  // A bar on its own needs a name; one that only draws a number printed beside it is aria-hidden instead.
  args: { value: 60, className: "w-64", "aria-label": "Qualification" },
} satisfies Meta<typeof Progress>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** The app uses it as a hairline bar for damage and qualification, not as a chunky meter. */
export const Hairline: Story = {
  render: (args) => (
    <div className="w-64 space-y-3">
      <Progress {...args} value={80} className="h-1 w-40" />
      <Progress {...args} value={35} className="h-1 w-40" />
    </div>
  ),
};

export const Steps: Story = {
  render: (args) => (
    <div className="space-y-2">
      {[0, 25, 50, 75, 100].map((value) => (
        <Progress {...args} key={value} value={value} />
      ))}
    </div>
  ),
};
