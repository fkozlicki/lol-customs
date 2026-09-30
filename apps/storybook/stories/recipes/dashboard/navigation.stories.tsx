import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DownloadAppButton } from "@v1/ui/recipes/dashboard/download-app-button";
import { DownloadAppDialog } from "@v1/ui/recipes/dashboard/download-app-dialog";
import { MobileNav } from "@v1/ui/recipes/dashboard/mobile-nav";
import type { NavItem } from "@v1/ui/recipes/dashboard/nav-item";
import { useState } from "react";
import { FORUM, PRIMARY, TOOLS } from "./nav.fixtures";

const meta = {
  title: "Dashboard",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;

const TABS: NavItem[] = [...PRIMARY, FORUM];
const MORE = TOOLS;

/** The bottom bar on a phone. The app marks the tab its pathname falls under. */
export const MobileNavigation: StoryObj = {
  render: () => (
    <div className="min-h-[30rem]">
      <MobileNav tabs={TABS} more={MORE} />
    </div>
  ),
};

/** A page under "More" is open, so "More" itself reads as active. */
export const MobileNavigationOnATool: StoryObj = {
  render: () => (
    <div className="min-h-[30rem]">
      <MobileNav
        tabs={TABS.map((tab) => ({ ...tab, active: false }))}
        more={MORE.map((item, i) => ({ ...item, active: i === 0 }))}
      />
    </div>
  ),
};

export const DownloadButton: StoryObj = {
  parameters: { layout: "centered" },
  render: () => <DownloadAppButton onClick={() => {}} />,
};

/** In the app it is open while `?download=true`, so a link can open it. */
export const DownloadDialog: StoryObj = {
  render: function Render() {
    const [open, setOpen] = useState(true);
    return (
      <DownloadAppDialog
        open={open}
        onOpenChange={setOpen}
        installerUrl="#installer"
        zipUrl="#zip"
      />
    );
  },
};
