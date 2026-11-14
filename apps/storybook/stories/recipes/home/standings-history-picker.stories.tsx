import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import StandingsHistoryPicker from "@v1/ui/recipes/home/standings-history-picker";
import { useState } from "react";
import { expect, fn } from "storybook/test";
import { wordsFor } from "../../words";

/** Fourteen matches played: the standings can be replayed after 1 … 13, then live. */
const OPTIONS = Array.from({ length: 13 }, (_, index) => index + 1);

const meta = {
  title: "Home/Standings history picker",
  component: StandingsHistoryPicker,
  args: { options: OPTIONS, value: null, onChange: fn() },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return (
      <StandingsHistoryPicker
        {...args}
        value={value}
        onChange={(next) => {
          args.onChange(next);
          setValue(next);
        }}
      />
    );
  },
} satisfies Meta<typeof StandingsHistoryPicker>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Live standings; in the app the choice is kept in `?after=`. Picking a count replays it; live is null. */
export const Live: Story = {
  play: async ({ args, canvas, globals, userEvent }) => {
    const t = wordsFor(globals).standings;
    const live = canvas.getByRole("button", { name: t.historyLive });
    await expect(live).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(canvas.getByRole("button", { name: "5" }));
    await expect(args.onChange).toHaveBeenLastCalledWith(5);
    await expect(canvas.getByRole("button", { name: "5" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await userEvent.click(live);
    await expect(args.onChange).toHaveBeenLastCalledWith(null);
  },
};

/** Viewing the standings as they were after five matches. */
export const AfterFiveMatches: Story = {
  args: { value: 5 },
};
