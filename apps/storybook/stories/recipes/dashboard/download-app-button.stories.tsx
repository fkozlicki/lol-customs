import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DownloadAppButton } from "@v1/ui/recipes/dashboard/download-app-button";
import { expect, fn } from "storybook/test";
import { wordsFor } from "../../words";

const meta = {
  title: "Dashboard/Download app button",
  component: DownloadAppButton,
  args: { onClick: fn() },
} satisfies Meta<typeof DownloadAppButton>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Offers Derby Sync, the desktop app that records matches; in the app it opens the download dialog. */
export const Default: Story = {
  play: async ({ args, canvas, globals, userEvent }) => {
    const t = wordsFor(globals).download;
    await userEvent.click(canvas.getByRole("button", { name: t.button }));
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};
