import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ChampionImage } from "@v1/ui/recipes/game-assets/champion-image";

/**
 * Champion portraits by the numeric id match data carries. Wukong's file is `MonkeyKing.png` and
 * Kai'Sa's is `Kaisa.png`, which is why the generated data keeps the file apart from the name.
 */
const meta = {
  title: "Game assets/Champion image",
  component: ChampionImage,
  args: { championId: 62, width: 48, height: 48 },
} satisfies Meta<typeof ChampionImage>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Wukong, whose file is not his name. */
export const Wukong: Story = {};

/** An id the data does not know — a champion newer than the generated list — gets the placeholder. */
export const Unknown: Story = { args: { championId: 999_999 } };

/** A few side by side, the unknown one last. */
export const Several: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      {[266, 62, 145, 1, 999_999].map((id) => (
        <ChampionImage key={id} {...args} championId={id} />
      ))}
    </div>
  ),
};
