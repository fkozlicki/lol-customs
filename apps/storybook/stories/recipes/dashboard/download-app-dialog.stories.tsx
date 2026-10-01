import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DownloadAppDialog } from "@v1/ui/recipes/dashboard/download-app-dialog";
import { expect, fn, screen } from "storybook/test";
import { wordsFor } from "../../words";

const meta = {
  title: "Dashboard/Download app dialog",
  component: DownloadAppDialog,
  parameters: { layout: "fullscreen" },
  args: {
    open: true,
    onOpenChange: fn(),
    installerUrl: "#installer",
    zipUrl: "#zip",
  },
} satisfies Meta<typeof DownloadAppDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

/** In the app it is open while `?download=true`, so a link can open it; Escape asks to close it. */
export const Open: Story = {
  play: async ({ args, globals, userEvent }) => {
    const t = wordsFor(globals).download;
    const dialog = await screen.findByRole("dialog", { name: t.title });
    await expect(dialog).toBeVisible();
    await expect(
      screen.getByRole("link", {
        name: new RegExp(t.installerExe.replace(/[().]/g, "\\$&")),
      }),
    ).toHaveAttribute("href", "#installer");
    await userEvent.keyboard("{Escape}");
    await expect(args.onOpenChange).toHaveBeenCalledWith(false);
  },
};
