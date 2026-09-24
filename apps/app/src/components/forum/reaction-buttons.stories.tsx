import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { ReactionButtons } from "./reaction-buttons";

const meta = {
  title: "Forum/Reaction buttons",
  component: ReactionButtons,
  args: {
    likes: 4,
    dislikes: 1,
    myReaction: null,
    likeLabel: "Like",
    dislikeLabel: "Dislike",
    onToggle: () => {},
  },
} satisfies Meta<typeof ReactionButtons>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Nobody has reacted yet. */
export const Default: Story = {};

/** The reader's own reaction is filled and takes the foreground colour. */
export const Liked: Story = {
  args: { myReaction: "like" },
};

export const Disliked: Story = {
  args: { myReaction: "dislike" },
};

/** `md` on a post, `sm` in a comment thread. */
export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col items-start gap-2">
      <ReactionButtons {...args} size="md" />
      <ReactionButtons {...args} size="sm" />
    </div>
  ),
};

/** Toggling is the caller's job, so the story owns the state the containers otherwise own. */
export const Interactive: Story = {
  render: (args) => {
    const [mine, setMine] = useState<string | null>(null);
    return (
      <ReactionButtons
        {...args}
        myReaction={mine}
        likes={args.likes + (mine === "like" ? 1 : 0)}
        dislikes={args.dislikes + (mine === "dislike" ? 1 : 0)}
        onToggle={(type) => setMine((prev) => (prev === type ? null : type))}
      />
    );
  },
};
