/**
 * `PageHeader` opens every page, so the stories are the shapes it actually takes: with an eyebrow on a
 * season-scoped page, with an action, and the skeleton that stands in while the page loads.
 */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "@v1/ui/button";
import { PageHeader, PageHeaderSkeleton, SectionHeading } from "./page-header";

const meta = {
  title: "Page header",
  component: PageHeader,
  parameters: { layout: "padded" },
  args: {
    title: "Leaderboard",
    description: "Every player with at least five matches this season.",
  },
} satisfies Meta<typeof PageHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithEyebrow: Story = {
  args: { eyebrow: "Season 3" },
};

export const WithAction: Story = {
  args: {
    eyebrow: "Season 3",
    children: <Button variant="outline">Season 2</Button>,
  },
};

/** The measure is capped, so a long description wraps rather than running the width of the page. */
export const LongDescription: Story = {
  args: {
    title: "Hall of Fame",
    description:
      "Forty titles, awarded once a season, each one earned by a single number: the most kills in a match, the longest win streak, the worst KDA anybody has managed to survive.",
  },
};

export const Skeleton: StoryObj = {
  render: () => <PageHeaderSkeleton eyebrow />,
};

/** The block heading below a page header — one implementation, not five. */
export const Section: StoryObj = {
  render: () => (
    <div className="space-y-10">
      <SectionHeading>Recent matches</SectionHeading>
      <SectionHeading action={<Button variant="ghost">See all</Button>}>
        Standings
      </SectionHeading>
    </div>
  ),
};
