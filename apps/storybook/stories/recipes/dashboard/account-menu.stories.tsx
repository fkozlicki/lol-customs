import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AccountMenu } from "@v1/ui/recipes/dashboard/account-menu";
import { expect, fn, screen } from "storybook/test";
import { OPEN_RADIX_MENU } from "../../a11y";
import { wordsFor } from "../../words";

const meta = {
  title: "Dashboard/Account menu",
  component: AccountMenu,
  args: {
    profile: null,
    loading: false,
    onSignIn: fn(),
    onSignOut: fn(),
    theme: "dark",
    onThemeChange: fn(),
    locale: "en",
    locales: ["en", "pl"],
    onLocaleChange: fn(),
    onDownload: fn(),
  },
} satisfies Meta<typeof AccountMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A visitor: open it for sign-in, theme, language and the Derby Sync download. */
export const Visitor: Story = {
  parameters: OPEN_RADIX_MENU,
  play: async ({ args, canvas, globals, userEvent, step }) => {
    const t = wordsFor(globals).account;
    await userEvent.click(canvas.getByRole("button", { name: t.menuLabel }));
    await step(
      "the current theme is marked, and another can be chosen",
      async () => {
        await expect(
          await screen.findByRole("menuitemradio", { name: t.themes.dark }),
        ).toHaveAttribute("aria-checked", "true");
        await userEvent.click(
          screen.getByRole("menuitemradio", { name: t.themes.light }),
        );
        await expect(args.onThemeChange).toHaveBeenCalledWith("light");
      },
    );
    await step("so can the language, without closing the menu", async () => {
      await userEvent.click(screen.getByRole("menuitemradio", { name: "pl" }));
      await expect(args.onLocaleChange).toHaveBeenCalledWith("pl");
    });
  },
};

/** Signed in: the avatar on the button, the nickname on top, sign-out at the bottom. */
export const SignedIn: Story = {
  args: { profile: { nickname: "Kestrel", avatarUrl: null } },
  play: async ({ args, canvas, globals, userEvent }) => {
    const t = wordsFor(globals).account;
    await userEvent.click(canvas.getByRole("button", { name: t.menuLabel }));
    await userEvent.click(
      await screen.findByRole("menuitem", { name: t.signOut }),
    );
    await expect(args.onSignOut).toHaveBeenCalledOnce();
  },
};
