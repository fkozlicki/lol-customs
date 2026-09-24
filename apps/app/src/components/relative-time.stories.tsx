import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RelativeTime } from "./relative-time";

const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

const meta = {
  title: "Relative time",
  component: RelativeTime,
  args: { date: ago(1000 * 60 * 90), className: "label-caps" },
} satisfies Meta<typeof RelativeTime>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Switch the locale in the toolbar: the date-fns locale follows the route segment. */
export const Default: Story = {};

export const Range: Story = {
  render: (args) => (
    <ul className="space-y-1">
      {[
        30_000,
        1000 * 60 * 5,
        1000 * 60 * 60 * 3,
        1000 * 60 * 60 * 24 * 2,
        1000 * 60 * 60 * 24 * 210,
      ].map((ms) => (
        <li key={ms}>
          <RelativeTime {...args} date={ago(ms)} />
        </li>
      ))}
    </ul>
  ),
};
