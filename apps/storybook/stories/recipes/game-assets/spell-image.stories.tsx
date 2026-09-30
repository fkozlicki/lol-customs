import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SpellImage } from "@v1/ui/recipes/game-assets/spell-image";

/** Summoner spells by the numeric id in match data. */
const meta = {
  title: "Game assets/Spell image",
  component: SpellImage,
  args: { spellId: 4, width: 24, height: 24 },
} satisfies Meta<typeof SpellImage>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Flash. */
export const Flash: Story = {};

/** The spells a custom game sees most. */
export const Common: Story = {
  render: (args) => (
    <div className="flex items-center gap-1">
      {[4, 14, 12, 11, 7, 32].map((id) => (
        <SpellImage key={id} {...args} spellId={id} />
      ))}
    </div>
  ),
};
