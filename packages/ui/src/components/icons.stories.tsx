import type { Meta, StoryObj } from "@storybook/react";
import { Icons } from "./icons";

const meta = {
  title: "Components/Icons",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;

/**
 * The shared set. Names say what an icon depicts, not what Derby uses it for, because Derby Sync
 * draws from the same map — `apps/app/src/components/icons.ts` adds the domain names on top.
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
