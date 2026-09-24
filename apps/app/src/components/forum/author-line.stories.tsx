import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AuthorLine } from "./author-line";

const meta = {
  title: "Forum/Author line",
  component: AuthorLine,
  args: {
    name: "Patologia",
    avatarUrl: null,
    date: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
} satisfies Meta<typeof AuthorLine>;

export default meta;

type Story = StoryObj<typeof meta>;

/** In a list and in a comment thread. */
export const Default: Story = {};

/** On a post, where the avatar is a step larger. */
export const OnAPost: Story = {
  args: { size: "md" },
};

/** No avatar uploaded: the first letter stands in, square like every other avatar. */
export const NoAvatar: Story = {
  args: { name: "wobbern" },
};

/** The author could not be resolved, so the caller passes the fallback it has already translated. */
export const Unknown: Story = {
  args: { name: "Unknown" },
};

/** Old enough that the relative time stops counting in hours. */
export const Old: Story = {
  args: { date: new Date("2026-02-14T10:00:00Z").toISOString() },
};
