import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DrawnTeam } from "@v1/ui/recipes/draw/drawn-team";
import { TEAMS } from "./draw.fixtures";

const meta = {
  title: "Draw/Drawn team",
  component: DrawnTeam,
  parameters: { layout: "padded" },
  args: { team: "a", view: TEAMS.a },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DrawnTeam>;

export default meta;

/** One team from a draw: the role icons, the captain marked, the average rank beside the name. */
export const Default: StoryObj<typeof meta> = {};
