import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import MatchHistoryCard from "@v1/ui/recipes/matches/match-history-card";
import { type ComponentProps, useState } from "react";
import { expect, fn } from "storybook/test";
import { wordsFor } from "../../words";
import { MATCH_CARD } from "./match.fixtures";

const meta = {
  title: "Matches/Match history card",
  component: MatchHistoryCard,
  parameters: { layout: "padded" },
  args: { match: MATCH_CARD, expanded: true, onToggleExpand: fn() },
  // Opening is the list's state; the story holds it so the chevron works.
  render: (args) => <StatefulCard key={String(args.expanded)} {...args} />,
} satisfies Meta<typeof MatchHistoryCard>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A card in a match list with its scoreboard open underneath; the chevron closes it again. */
export const Open: Story = {
  play: async ({ canvas, globals, userEvent }) => {
    const t = wordsFor(globals).match;
    const toggle = canvas.getByRole("button", { name: t.expand });
    await expect(canvas.getAllByRole("table").length).toBeGreaterThan(0);
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(canvas.queryByRole("table")).toBeNull();
  },
};

/** Closed, as a list first shows it. */
export const Closed: Story = { args: { expanded: false } };

function StatefulCard(args: ComponentProps<typeof MatchHistoryCard>) {
  const [expanded, setExpanded] = useState(args.expanded);
  return (
    <MatchHistoryCard
      {...args}
      expanded={expanded}
      onToggleExpand={() => {
        args.onToggleExpand();
        setExpanded((open) => !open);
      }}
    />
  );
}
