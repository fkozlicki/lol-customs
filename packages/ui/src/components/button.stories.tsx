import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./button";
import { Icons } from "./icons";

const meta = {
  title: "Components/Button",
  component: Button,
  args: { children: "Download Derby Sync" },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/**
 * `destructive` is a tinted background with destructive text, not a filled red block — colour here
 * still reads as meaning rather than emphasis.
 */
export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-2">
      <Button {...args} variant="default">
        Default
      </Button>
      <Button {...args} variant="outline">
        Outline
      </Button>
      <Button {...args} variant="secondary">
        Secondary
      </Button>
      <Button {...args} variant="ghost">
        Ghost
      </Button>
      <Button {...args} variant="destructive">
        Destructive
      </Button>
      <Button {...args} variant="link">
        Link
      </Button>
    </div>
  ),
};

/** Every size renders square: the radius tokens are `0`, so the `rounded-*` in here is a no-op. */
export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-baseline gap-2">
      <Button {...args} size="xs">
        xs
      </Button>
      <Button {...args} size="sm">
        sm
      </Button>
      <Button {...args} size="default">
        default
      </Button>
      <Button {...args} size="lg">
        lg
      </Button>
      <Button {...args} size="xl">
        xl
      </Button>
    </div>
  ),
};

export const WithIcon: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-2">
      <Button {...args} variant="outline">
        <Icons.Download className="size-4" />
        Download
      </Button>
      <Button {...args} size="icon" variant="ghost" aria-label="More">
        <Icons.Ellipsis className="size-4" />
      </Button>
    </div>
  ),
};

export const Disabled: Story = {
  args: { disabled: true },
};
