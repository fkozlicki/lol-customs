import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "./input";
import { Label } from "./label";

const meta = {
  title: "Components/Input",
  component: Input,
  args: { placeholder: "Search players" },
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => <Input {...args} className="w-72" />,
};

/** A label above an input is `label-caps`, like every other label in the app. */
export const WithLabel: Story = {
  render: (args) => (
    <div className="w-72 space-y-2">
      <Label htmlFor="riot-id" className="label-caps">
        Riot ID
      </Label>
      <Input {...args} id="riot-id" placeholder="Player#EUNE" />
    </div>
  ),
};

export const Disabled: Story = {
  render: (args) => <Input {...args} className="w-72" disabled />,
};

export const Invalid: Story = {
  render: (args) => (
    <Input
      {...args}
      className="w-72"
      aria-invalid
      defaultValue="not-a-riot-id"
    />
  ),
};
