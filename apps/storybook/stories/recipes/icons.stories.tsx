import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Icons as SharedIcons } from "@v1/ui/icons";
import { Icons } from "@v1/ui/recipes/icons";

const meta = {
  title: "Icons",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;

/**
 * The names Derby adds on top of the shared set, each after a CONTEXT.md term. The rest of the map is
 * the shared set itself — Design system › Components › Icons.
 */
export const DerbyNames: StoryObj = {
  render: () => (
    <div className="grid grid-cols-3 gap-px bg-border sm:grid-cols-6">
      {Object.entries(Icons)
        .filter(([name]) => !(name in SharedIcons))
        .map(([name, Icon]) => (
          <div
            key={name}
            className="flex flex-col items-center gap-2 bg-background p-4"
          >
            <Icon className="size-5" />
            <span className="num text-[10px] text-muted-foreground">
              {name}
            </span>
          </div>
        ))}
    </div>
  ),
};
