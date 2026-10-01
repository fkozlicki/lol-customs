import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EventFeed } from "@v1/ui/recipes/auctions/event-feed";
import { EVENTS } from "./auction-room.fixtures";

const meta = {
  title: "Auctions/Event feed",
  component: EventFeed,
  parameters: { layout: "padded" },
  args: { events: EVENTS },
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EventFeed>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Every line the feed can say, newest first. */
export const AllEvents: Story = {};

/** Nothing has happened yet. */
export const Empty: Story = { args: { events: [] } };
