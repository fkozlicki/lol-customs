import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AccountMenu } from "@v1/ui/recipes/dashboard/account-menu";
import { SeasonSelector } from "@v1/ui/recipes/dashboard/season-selector";
import { TopBar } from "@v1/ui/recipes/dashboard/top-bar";
import { expect, fn, screen } from "storybook/test";
import { OPEN_RADIX_MENU } from "../../a11y";
import { wordsFor } from "../../words";
import { FORUM, PRIMARY, TOOLS } from "./nav.fixtures";
import { SEASONS } from "./season.fixtures";

const meta = {
  title: "Dashboard/Top bar",
  component: TopBar,
  parameters: { layout: "fullscreen" },
  args: {
    homeHref: "/",
    logoSrc: "/jasper.jpg",
    primary: PRIMARY,
    tools: TOOLS,
    forum: FORUM,
    actions: (
      <>
        <SeasonSelector
          seasons={SEASONS}
          allSeasonsValue="all"
          value="2"
          onChange={fn()}
        />
        <AccountMenu
          profile={null}
          loading={false}
          onSignIn={fn()}
          onSignOut={fn()}
          theme="dark"
          onThemeChange={fn()}
          locale="en"
          locales={["en", "pl"]}
          onLocaleChange={fn()}
          onDownload={fn()}
        />
      </>
    ),
  },
} satisfies Meta<typeof TopBar>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The bar on wide screens; the current page is underlined. Narrower than md, the links hide. */
export const Default: Story = {
  globals: { viewport: { value: "desktop", isRotated: false } },
};

/** The Tools menu lists the tools, the current one marked. */
export const ToolsOpen: Story = {
  globals: { viewport: { value: "desktop", isRotated: false } },
  parameters: OPEN_RADIX_MENU,
  play: async ({ canvas, globals, userEvent }) => {
    const t = wordsFor(globals).nav;
    await userEvent.click(
      canvas.getByRole("button", { name: new RegExp(t.tools) }),
    );
    for (const tool of TOOLS) {
      await expect(
        await screen.findByRole("menuitem", { name: tool.label }),
      ).toBeVisible();
    }
  },
};

/** On a tool's page the Tools menu reads as current. */
export const OnATool: Story = {
  globals: { viewport: { value: "desktop", isRotated: false } },
  args: {
    primary: PRIMARY.map((item) => ({ ...item, active: false })),
    tools: TOOLS.map((item, i) => ({ ...item, active: i === 0 })),
  },
};
