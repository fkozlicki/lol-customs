import type { Meta, StoryObj } from "@storybook/react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "./chart";

const meta = {
  title: "Components/Chart",
  parameters: { layout: "centered" },
} satisfies Meta;

export default meta;

type Story = StoryObj;

const DATA = [
  { match: 1, rating: 1000 },
  { match: 2, rating: 1014 },
  { match: 3, rating: 1002 },
  { match: 4, rating: 1031 },
  { match: 5, rating: 1045 },
  { match: 6, rating: 1029 },
  { match: 7, rating: 1017 },
];

const config = {
  rating: { label: "Rating", color: "var(--chart-1)" },
} satisfies ChartConfig;

/**
 * Series colours come from `chart-1…5`, so a chart follows the theme like everything else. The
 * axis labels are `label-caps` and the values are `num` — a chart is still a column of numbers.
 */
export const RatingHistory: Story = {
  render: () => (
    <ChartContainer config={config} className="h-64 w-[36rem]">
      <LineChart data={DATA} margin={{ left: 8, right: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="match"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          className="label-caps"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={44}
          domain={["dataMin - 10", "dataMax + 10"]}
          className="num"
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line
          dataKey="rating"
          type="linear"
          stroke="var(--color-rating)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  ),
};
