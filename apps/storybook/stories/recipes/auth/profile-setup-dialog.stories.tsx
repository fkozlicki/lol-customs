import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ProfileSetupDialog } from "@v1/ui/recipes/auth/profile-setup-dialog";
import { expect, fn, screen } from "storybook/test";
import { wordsFor } from "../../words";

const meta = {
  title: "Auth/Profile setup dialog",
  component: ProfileSetupDialog,
  args: {
    open: true,
    onOpenChange: fn(),
    avatarPreview: null,
    onPickAvatar: fn(),
    nickname: "",
    nicknameInput: { name: "nickname" },
    pending: false,
    // A real submit would reload the story; the app's form handler does the rest.
    onSubmit: fn((event) => event.preventDefault()),
  },
} satisfies Meta<typeof ProfileSetupDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Signing in is joining: no avatar yet, so the square offers a camera; picking a file hands it over. */
export const Blank: Story = {
  play: async ({ args, globals, userEvent }) => {
    const t = wordsFor(globals).profileSetup;
    const dialog = await screen.findByRole("dialog", { name: t.title });
    const picture = new File(["avatar"], "avatar.png", { type: "image/png" });
    const input = dialog.querySelector<HTMLInputElement>('input[type="file"]');
    await userEvent.upload(input!, picture);
    await expect(args.onPickAvatar).toHaveBeenCalledWith(picture);
    await userEvent.click(screen.getByRole("button", { name: t.submit }));
    await expect(args.onSubmit).toHaveBeenCalledOnce();
  },
};

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
