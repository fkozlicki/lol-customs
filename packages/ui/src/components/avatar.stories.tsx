import type { Meta, StoryObj } from "@storybook/react";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";

const meta = {
  title: "Components/Avatar",
  component: Avatar,
} satisfies Meta<typeof Avatar>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * shadcn ships `rounded-full`. DESIGN.md rule 4 makes avatars square, so every call site passes
 * `rounded-none` — on the root and on both children, because the radius is set on each.
 */
export const Default: Story = {
  render: (args) => (
    <Avatar {...args} className="size-10 rounded-none">
      <AvatarFallback className="rounded-none font-semibold">PA</AvatarFallback>
    </Avatar>
  ),
};

/** Left: the component's own default. Right: how the app uses it. */
export const RoundVersusSquare: Story = {
  render: (args) => (
    <div className="flex items-center gap-4">
      <Avatar {...args} className="size-10">
        <AvatarFallback className="font-semibold">PA</AvatarFallback>
      </Avatar>
      <Avatar {...args} className="size-10 rounded-none">
        <AvatarFallback className="rounded-none font-semibold">
          PA
        </AvatarFallback>
      </Avatar>
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      {["size-5", "size-6", "size-8", "size-10", "size-16"].map((size) => (
        <Avatar key={size} {...args} className={`${size} rounded-none`}>
          <AvatarFallback className="rounded-none text-[10px] font-semibold">
            PA
          </AvatarFallback>
        </Avatar>
      ))}
    </div>
  ),
};

/**
 * An image that fails to load falls back to the initials rather than an empty box. The source is
 * undecodable data rather than a dead URL, so the story shows the failure without a network error —
 * `test:stories` fails on any console error, and it should.
 */
export const BrokenImage: Story = {
  render: (args) => (
    <Avatar {...args} className="size-10 rounded-none">
      <AvatarImage src="data:image/png;base64,AAAA" />
      <AvatarFallback className="rounded-none font-semibold">WO</AvatarFallback>
    </Avatar>
  ),
};
