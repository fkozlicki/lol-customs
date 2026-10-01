import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { HallOfFame } from "@v1/ui/recipes/hof/hall-of-fame";
import { HALL_OF_FAME } from "./hof.fixtures";

const meta = {
  title: "Hall of Fame/Hall of Fame",
  component: HallOfFame,
  parameters: { layout: "padded" },
  args: { hallOfFame: HALL_OF_FAME },
} satisfies Meta<typeof HallOfFame>;

export default meta;

/**
 * Who collects the most titles, then every section: best and worst on one stat side by side, unpaired
 * titles in a grid. On phones a row of section links jumps down the page.
 */
export const Default: StoryObj<typeof meta> = {};
