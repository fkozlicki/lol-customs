import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ProfileSetupDialog } from "@v1/ui/recipes/auth/profile-setup-dialog";

const noop = () => {};

const meta = {
  title: "Auth/Profile setup dialog",
  component: ProfileSetupDialog,
  args: {
    open: true,
    onOpenChange: noop,
    avatarPreview: null,
    onPickAvatar: noop,
    nickname: "",
    nicknameInput: { name: "nickname" },
    pending: false,
    onSubmit: (event) => event.preventDefault(),
  },
} satisfies Meta<typeof ProfileSetupDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Signing in is joining: no avatar yet, so the square offers a camera. */
export const Blank: Story = {};

/** With a nickname typed, its first letter stands in for the avatar. */
export const Typed: Story = {
  args: {
    nickname: "Kestrel",
    nicknameInput: { name: "nickname", defaultValue: "Kestrel" },
  },
};

/** A nickname the ladder will not take. */
export const Invalid: Story = {
  args: {
    nickname: "K",
    nicknameInput: { name: "nickname", defaultValue: "K" },
    nicknameError: "Nicknames are at least 2 characters.",
  },
};

/** While the profile is being set up. */
export const SettingUp: Story = {
  args: {
    nickname: "Kestrel",
    nicknameInput: { name: "nickname", defaultValue: "Kestrel" },
    pending: true,
  },
};
