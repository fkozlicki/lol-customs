import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ProfileIcon } from "@v1/ui/recipes/game-assets/profile-icon";

/** A Riot profile icon, square like every avatar in the app. */
const meta = {
  title: "Game assets/Profile icon",
  component: ProfileIcon,
  args: {
    iconId: 1151,
    name: "Kestrel",
    avatarClassName: "size-10 rounded-none",
    fallbackClassName: "rounded-none",
  },
} satisfies Meta<typeof ProfileIcon>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithIcon: Story = {};

/** A player with no icon on record gets the name's initials. */
export const Fallback: Story = { args: { iconId: null } };
