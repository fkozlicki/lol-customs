import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Icons } from "../icons";
import { DownloadAppButton } from "./download-app-button";
import { DownloadAppDialog } from "./download-app-dialog";
import { MobileNav, type NavItem } from "./mobile-nav";

const meta = {
  title: "Dashboard",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;

const TABS: NavItem[] = [
  { href: "/", label: "Leaderboard", icon: Icons.Leaderboard, active: true },
  { href: "/matches", label: "Matches", icon: Icons.Matches, active: false },
  {
    href: "/hof",
    label: "Hall of Fame",
    icon: Icons.HallOfFame,
    active: false,
  },
  { href: "/posts", label: "Forum", icon: Icons.MessageSquare, active: false },
];

const MORE: NavItem[] = [
  { href: "/shuffle", label: "Shuffle", icon: Icons.Shuffle, active: false },
  { href: "/auctions", label: "Auctions", icon: Icons.Auction, active: false },
];

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
