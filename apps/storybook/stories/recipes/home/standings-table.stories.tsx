import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { StandingsTable } from "@v1/ui/recipes/home/standings-table";
import { QUALIFICATION_MATCHES, STANDINGS } from "./standings.fixtures";

const meta = {
  title: "Home/Standings table",
  component: StandingsTable,
  parameters: { layout: "padded" },
  args: { rows: STANDINGS, qualificationMatches: QUALIFICATION_MATCHES },
} satisfies Meta<typeof StandingsTable>;

export default meta;

/**
 * Ranked players by position, then the ones still qualifying below a divider that says when they
 * join. Narrow the canvas to watch the secondary columns drop.
 */
export const Default: StoryObj<typeof meta> = {};
