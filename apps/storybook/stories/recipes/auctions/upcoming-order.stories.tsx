import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { UpcomingOrder } from "@v1/ui/recipes/auctions/upcoming-order";

/** Under the stage, for a room that shows its draw order: who goes on sale next. */
const meta = {
  title: "Auctions/Upcoming order",
  component: UpcomingOrder,
  parameters: { layout: "padded" },
  args: { players: ["Bramble", "Quill", "Emberly"] },
} satisfies Meta<typeof UpcomingOrder>;

export default meta;

export const Upcoming: StoryObj<typeof meta> = {};
