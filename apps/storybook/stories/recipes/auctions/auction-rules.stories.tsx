import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AuctionRules } from "@v1/ui/recipes/auctions/auction-rules";
import { type ComponentProps, useState } from "react";
import { expect, fn } from "storybook/test";
import { wordsFor } from "../../words";

const meta = {
  title: "Auctions/Rules",
  component: AuctionRules,
  parameters: { layout: "padded" },
  args: {
    settings: {
      teamName: "Team A",
      budget: 20,
      bidSeconds: 30,
      revealOrder: false,
    },
    onChange: fn(),
    askTeamName: true,
  },
  // The fields are controlled, so the story holds the settings, as the app's form does. Changing them
  // in Controls starts it again from there.
  render: (args) => (
    <StatefulRules key={JSON.stringify(args.settings)} {...args} />
  ),
} satisfies Meta<typeof AuctionRules>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A new room: the creator's team name, the budget, the bid timer and whether the order is public. */
export const Create: Story = {
  play: async ({ args, canvas, globals, userEvent }) => {
    const t = wordsFor(globals).auctions.creator;
    const budget = canvas.getByRole("spinbutton", { name: t.budget });
    await userEvent.clear(budget);
    await userEvent.type(budget, "35");
    await expect(args.onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ budget: 35 }),
    );
  },
};

/** Editing a lobby: the team already has a name, so the rules do not ask for one. */
export const EditLobby: Story = {
  args: {
    settings: { teamName: "", budget: 30, bidSeconds: 20, revealOrder: true },
    askTeamName: false,
  },
  play: async ({ canvas, globals }) => {
    const t = wordsFor(globals).auctions.creator;
    await expect(
      canvas.queryByRole("textbox", { name: t.teamName }),
    ).toBeNull();
  },
};

function StatefulRules(args: ComponentProps<typeof AuctionRules>) {
  const [settings, setSettings] = useState(args.settings);
  return (
    <AuctionRules
      {...args}
      settings={settings}
      onChange={(value) => {
        args.onChange(value);
        setSettings(value);
      }}
    />
  );
}
