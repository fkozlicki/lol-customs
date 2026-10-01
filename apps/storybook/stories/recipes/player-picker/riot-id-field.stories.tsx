import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RiotIdField } from "@v1/ui/recipes/player-picker/riot-id-field";
import { type ComponentProps, useState } from "react";
import { expect, fn } from "storybook/test";

const meta = {
  title: "Player picker/Riot ID field",
  component: RiotIdField,
  parameters: { layout: "padded" },
  args: {
    id: "story-riot-id",
    label: "Riot ID",
    placeholder: "SummonerName#TAG",
    addLabel: "Add",
    value: "",
    onChange: fn(),
    onAdd: fn(),
    disabled: false,
  },
  // The field is controlled, so the story holds its value, as the app does.
  render: (args) => <StatefulRiotIdField key={args.value} {...args} />,
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RiotIdField>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Someone not on the ladder yet, by Riot ID; Enter adds, as the button does. */
export const Typing: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(
      canvas.getByRole("textbox", { name: "Riot ID" }),
      "Wren#PL1{Enter}",
    );
    await expect(args.onChange).toHaveBeenLastCalledWith("Wren#PL1");
    await expect(args.onAdd).toHaveBeenCalledOnce();
  },
};

/** With the pick full, neither Enter nor the button adds. */
export const Full: Story = {
  args: { disabled: true, value: "Wren#PL1" },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(
      canvas.getByRole("textbox", { name: "Riot ID" }),
      "{Enter}",
    );
    await expect(canvas.getByRole("button", { name: "Add" })).toBeDisabled();
    await expect(args.onAdd).not.toHaveBeenCalled();
  },
};

function StatefulRiotIdField(args: ComponentProps<typeof RiotIdField>) {
  const [value, setValue] = useState(args.value);
  return (
    <RiotIdField
      {...args}
      value={value}
      onChange={(next) => {
        args.onChange(next);
        setValue(next);
      }}
    />
  );
}
