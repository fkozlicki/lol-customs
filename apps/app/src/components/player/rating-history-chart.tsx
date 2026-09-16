"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@v1/ui/chart";
import { format } from "date-fns";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import { SectionHeading } from "@/components/page-header";
import { useScopedI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/react";

interface RatingHistoryChartProps {
  puuid: string;
  season: number;
  /** Season start markers drawn on the all-time chart. */
  seasonStarts?: { number: number; startsAt: string }[];
}

const chartConfig = {
  rating: {
    label: "Rating",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function RatingHistoryChart({
  puuid,
  season,
  seasonStarts = [],
}: RatingHistoryChartProps) {
  const t = useScopedI18n("dashboard.pages.player");
  const trpc = useTRPC();
  const { data: history } = useSuspenseQuery(
    trpc.players.ratingHistory.queryOptions({ puuid, season }),
  );

  if (!history || history.length === 0) {
    return (
      <section>
        <SectionHeading>{t("ratingHistory")}</SectionHeading>
        <p className="text-sm text-muted-foreground">{t("noRatingHistory")}</p>
      </section>
    );
  }

  const chartData = history.map((point, i) => ({
    index: i + 1,
    rating: point.rating_after,
    date: point.created_at
      ? format(new Date(point.created_at), "MMM d, HH:mm")
      : `Game ${i + 1}`,
  }));

  // Index of the first game played in each season, for the season boundary lines.
  const seasonMarkers = seasonStarts.flatMap(({ number, startsAt }) => {
    const startMs = new Date(startsAt).getTime();
    const firstIndex = history.findIndex(
      (point) =>
        point.created_at != null &&
        new Date(point.created_at).getTime() >= startMs,
    );
    return firstIndex > 0 ? [{ number, index: firstIndex + 1 }] : [];
  });

  const ratings = chartData.map((d) => d.rating ?? 0);
  const minRating = Math.min(...ratings);
  const maxRating = Math.max(...ratings);
  const padding = Math.max(50, Math.round((maxRating - minRating) * 0.15));
  const yMin = Math.floor((minRating - padding) / 10) * 10;
  const yMax = Math.ceil((maxRating + padding) / 10) * 10;

  return (
    <section>
      <SectionHeading>{t("ratingHistory")}</SectionHeading>
      <ChartContainer config={chartConfig} className="h-56 w-full">
        <LineChart
          data={chartData}
          margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
        >
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <ReferenceLine
            y={1000}
            stroke="var(--muted-foreground)"
            strokeDasharray="2 4"
          />
          <XAxis dataKey="index" hide />
          <YAxis
            domain={[yMin, yMax]}
            tick={{
              fontSize: 11,
              fontFamily: "var(--font-mono)",
              fill: "var(--muted-foreground)",
            }}
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
          {seasonMarkers.map((marker) => (
            <ReferenceLine
              key={marker.number}
              x={marker.index}
              stroke="var(--muted-foreground)"
              strokeDasharray="4 4"
              label={{
                value: `S${marker.number}`,
                position: "insideTopLeft",
                fontSize: 10,
                fill: "var(--muted-foreground)",
              }}
            />
          ))}
          <Line
            dataKey="rating"
            type="linear"
            stroke="var(--color-rating)"
            strokeWidth={1.5}
            dot={false}
            animationDuration={800}
            activeDot={{
              r: 5,
              stroke: "var(--color-rating)",
              strokeWidth: 2,
              fill: "var(--background)",
            }}
          />
        </LineChart>
      </ChartContainer>
    </section>
  );
}
