import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SeasonSelector } from "@v1/ui/recipes/dashboard/season-selector";
import { useState } from "react";
import { expect, fn, screen } from "storybook/test";
import { OPEN_RADIX_MENU } from "../../a11y";
import { wordsFor } from "../../words";
import { SEASONS } from "./season.fixtures";

const meta = {
  title: "Dashboard/Season selector",
  component: SeasonSelector,
  args: {
    seasons: SEASONS,
    allSeasonsValue: "all",
    value: "2",
    onChange: fn(),
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return (
      <SeasonSelector
        {...args}
        value={value}
        onChange={(next) => {
          args.onChange(next);
          setValue(next);
        }}
      />
    );
  },
} satisfies Meta<typeof SeasonSelector>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The current season; the menu lists seasons newest first, then all seasons. */
export const CurrentSeason: Story = {};

export const AllSeasons: Story = {
  args: { value: "all" },
};

/** Choosing a season hands its value back and closes the menu. */
export const Choosing: Story = {
  parameters: OPEN_RADIX_MENU,
  play: async ({ args, canvas, globals, userEvent }) => {
    const t = wordsFor(globals).season;
    await userEvent.click(canvas.getByRole("button"));
    await userEvent.click(
      await screen.findByRole("menuitemradio", { name: new RegExp(t.allTime) }),
    );
    await expect(args.onChange).toHaveBeenCalledWith("all");
  },
};
