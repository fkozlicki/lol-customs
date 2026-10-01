import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ItemImage } from "@v1/ui/recipes/game-assets/item-image";

const meta = {
  title: "Game assets/Item image",
  component: ItemImage,
  args: { itemId: 3031, width: 28, height: 28 },
} satisfies Meta<typeof ItemImage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Item: Story = {};

/** An empty slot keeps its square, so a row of six stays aligned. */
export const EmptySlot: Story = { args: { itemId: 0 } };

/** A build, with an empty slot in it. */
export const Build: Story = {
  render: (args) => (
    <div className="flex items-center gap-1">
      {[3031, 6672, 3006, 3036, 0, 3363].map((id, i) => (
        <ItemImage key={`${id}-${i}`} {...args} itemId={id} />
      ))}
    </div>
  ),
};
