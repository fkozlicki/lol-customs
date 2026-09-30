import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AccountMenu } from "@v1/ui/recipes/dashboard/account-menu";
import { SeasonSelector } from "@v1/ui/recipes/dashboard/season-selector";
import { TopBar } from "@v1/ui/recipes/dashboard/top-bar";
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
          onChange={() => {}}
        />
        <AccountMenu
          profile={null}
          loading={false}
          onSignIn={() => {}}
          onSignOut={() => {}}
          theme="dark"
          onThemeChange={() => {}}
          locale="en"
          locales={["en", "pl"]}
          onLocaleChange={() => {}}
          onDownload={() => {}}
        />
      </>
    ),
  },
} satisfies Meta<typeof TopBar>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The bar on wide screens; the current page is underlined. Narrower than md, the links hide. */
export const Default: Story = {};

/** On a tool's page the Tools menu reads as current. */
export const OnATool: Story = {
  args: {
    primary: PRIMARY.map((item) => ({ ...item, active: false })),
    tools: TOOLS.map((item, i) => ({ ...item, active: i === 0 })),
  },
};
