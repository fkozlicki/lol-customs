import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MobileNav } from "@v1/ui/recipes/dashboard/mobile-nav";
import { expect, screen } from "storybook/test";
import { wordsFor } from "../../words";
import { FORUM, PRIMARY, TOOLS } from "./nav.fixtures";

const meta = {
  title: "Dashboard/Mobile nav",
  component: MobileNav,
  parameters: { layout: "fullscreen" },
  // The bar only shows below md; the story opens on a phone.
  globals: { viewport: { value: "phone", isRotated: false } },
  args: { tabs: [...PRIMARY, FORUM], more: TOOLS },
  decorators: [
    (Story) => (
      <div className="min-h-[30rem]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MobileNav>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The bottom bar on a phone, the current tab marked; "More" opens the tools in a sheet. */
export const OnATab: Story = {
  play: async ({ canvas, globals, userEvent }) => {
    const t = wordsFor(globals).nav;
    await userEvent.click(canvas.getByRole("button", { name: t.more }));
    const sheet = await screen.findByRole("dialog", { name: t.more });
    for (const tool of TOOLS) {
      await expect(sheet).toHaveTextContent(tool.label);
    }
  },
};

/** A page under "More" is open, so "More" itself reads as active. */
export const OnATool: Story = {
  args: {
    tabs: [...PRIMARY, FORUM].map((tab) => ({ ...tab, active: false })),
    more: TOOLS.map((item, i) => ({ ...item, active: i === 0 })),
  },
};
