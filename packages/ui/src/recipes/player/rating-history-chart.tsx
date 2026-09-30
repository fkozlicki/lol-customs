"use client";

import { useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../../components/chart";
import { DURATION } from "../motion";
import { SectionHeading } from "../page-header";
import type { RatingPointView, SeasonMarkerView } from "./player-view";

interface RatingHistoryChartProps {
  points: RatingPointView[];
  /** Where each season began, drawn on the all-time chart. */
  seasonMarkers?: SeasonMarkerView[];
}

const chartConfig = {
  rating: { label: "Rating", color: "var(--chart-1)" },
} satisfies ChartConfig;

/** Every rating fits, with room around it, on round tens; the 1000 start line always shows. */
function yDomain(points: RatingPointView[]): [number, number] {
  const ratings = points.map((point) => point.rating);
  const min = Math.min(...ratings);
  const max = Math.max(...ratings);
  const padding = Math.max(50, Math.round((max - min) * 0.15));
  return [
    Math.floor((min - padding) / 10) * 10,
    Math.ceil((max + padding) / 10) * 10,
  ];
}

/** The player's rating after each match on the selected track, against the 1000 everyone starts at. */
export function RatingHistoryChart({
  points,
  seasonMarkers = [],
}: RatingHistoryChartProps) {
  const t = useTranslations("player");
  const reduceMotion = useReducedMotion();

  if (points.length === 0) {
    return (
      <section>
        <SectionHeading>{t("ratingHistory")}</SectionHeading>
        <p className="text-sm text-muted-foreground">{t("noRatingHistory")}</p>
      </section>
    );
  }

  return (
    <section>
      <SectionHeading>{t("ratingHistory")}</SectionHeading>
      <ChartContainer config={chartConfig} className="h-56 w-full">
        <LineChart
          data={points}
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
            domain={yDomain(points)}
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
                  payload?.[0]?.payload?.label ?? ""
                }
              />
            }
          />
          {seasonMarkers.map((marker) => (
            <ReferenceLine
              key={marker.seasonNumber}
              x={marker.index}
              stroke="var(--muted-foreground)"
              strokeDasharray="4 4"
              label={{
                value: `S${marker.seasonNumber}`,
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
            isAnimationActive={!reduceMotion}
            animationDuration={DURATION.slow * 1000}
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
