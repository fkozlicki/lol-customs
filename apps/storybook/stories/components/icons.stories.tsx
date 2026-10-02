import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Icons } from "@v1/ui/icons";

const meta = {
  title: "Components/Icons",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;

/**
 * Every icon Derby uses, for the app, the recipes and Derby Sync. Most are named after what they
 * depict; one that stands for a CONTEXT.md term is named after the term (`Leaderboard`, `Auction`).
 */
export const All: StoryObj = {
  render: () => (
    <div className="grid grid-cols-3 gap-px bg-border sm:grid-cols-6">
      {Object.entries(Icons).map(([name, Icon]) => (
        <div
          key={name}
          className="flex flex-col items-center gap-2 bg-background p-4"
        >
          <Icon className="size-5" />
          <span className="num text-[10px] text-muted-foreground">{name}</span>
        </div>
      ))}
    </div>
  ),
};
