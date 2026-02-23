"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@v1/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@v1/ui/chart";
import { format } from "date-fns";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { useTRPC } from "@/trpc/react";

interface RatingHistoryChartProps {
  puuid: string;
}

const chartConfig = {
  rating: {
    label: "Rating",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function RatingHistoryChart({ puuid }: RatingHistoryChartProps) {
  const trpc = useTRPC();
  const { data: history } = useSuspenseQuery(
    trpc.players.ratingHistory.queryOptions({ puuid }),
  );

  if (!history || history.length === 0) {
    return (
      <Card className="ring-0 rounded-sm">
        <CardHeader className="pb-2">
          <CardTitle>Rating History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No rating history yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData = history.map((point, i) => ({
    index: i + 1,
    rating: point.rating_after,
    date: point.created_at
      ? format(new Date(point.created_at), "MMM d, HH:mm")
      : `Game ${i + 1}`,
  }));

  const ratings = chartData.map((d) => d.rating ?? 0);
  const minRating = Math.min(...ratings);
  const maxRating = Math.max(...ratings);
  const padding = Math.max(50, Math.round((maxRating - minRating) * 0.15));
  const yMin = Math.floor((minRating - padding) / 10) * 10;
  const yMax = Math.ceil((maxRating + padding) / 10) * 10;

  return (
    <Card className="ring-0 rounded-sm">
      <CardHeader className="pb-2">
        <CardTitle>Rating History</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-48 w-full">
          <LineChart
            data={chartData}
            margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="index" hide />
            <YAxis
              domain={[yMin, yMax]}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload?.date ?? ""
                  }
                />
              }
            />
            <Line
              dataKey="rating"
              type="linear"
              stroke="var(--color-rating)"
              strokeWidth={2}
              dot={false}
              activeDot={{
                r: 5,
                stroke: "var(--color-rating)",
                strokeWidth: 2,
                fill: "var(--background)",
              }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
