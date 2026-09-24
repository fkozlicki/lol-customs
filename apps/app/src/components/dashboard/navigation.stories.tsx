import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DownloadAppButton } from "./download-app-button";
import { DownloadAppDialog } from "./download-app-dialog";
import { MobileNav } from "./mobile-nav";

const meta = {
  title: "Dashboard",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;

/** The bottom bar on a phone. The active item follows the pathname. */
export const MobileNavigation: StoryObj = {
  parameters: { viewport: { defaultViewport: "mobile1" } },
  render: () => (
    <div className="min-h-[30rem]">
      <MobileNav />
    </div>
  ),
};

export const DownloadButton: StoryObj = {
  parameters: { layout: "centered" },
  render: () => <DownloadAppButton />,
};

/** Opened through the query string — `?download=true` — so a link can open it. */
export const DownloadDialog: StoryObj = {
  parameters: { searchParams: { download: "true" } },
  render: () => <DownloadAppDialog />,
};
