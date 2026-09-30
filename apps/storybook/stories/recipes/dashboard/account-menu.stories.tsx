import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AccountMenu } from "@v1/ui/recipes/dashboard/account-menu";

const meta = {
  title: "Dashboard/Account menu",
  component: AccountMenu,
  args: {
    profile: null,
    loading: false,
    onSignIn: () => {},
    onSignOut: () => {},
    theme: "dark",
    onThemeChange: () => {},
    locale: "en",
    locales: ["en", "pl"],
    onLocaleChange: () => {},
    onDownload: () => {},
  },
} satisfies Meta<typeof AccountMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A visitor: open it for sign-in, theme, language and the Derby Sync download. */
export const Visitor: Story = {};

/** Signed in: the avatar on the button, the nickname on top, sign-out at the bottom. */
export const SignedIn: Story = {
  args: { profile: { nickname: "Kestrel", avatarUrl: null } },
};
