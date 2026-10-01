import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AuctionListError } from "@v1/ui/recipes/auctions/auction-list-error";
import { expect, fn } from "storybook/test";
import { wordsFor } from "../../words";

const meta = {
  title: "Auctions/List error",
  component: AuctionListError,
  parameters: { layout: "padded" },
  args: { onRetry: fn() },
} satisfies Meta<typeof AuctionListError>;

export default meta;

/** The list could not be loaded; trying again reads it once more. */
export const LoadFailed: StoryObj<typeof meta> = {
  play: async ({ args, canvas, globals, userEvent }) => {
    const t = wordsFor(globals).auctions.actions;
    await userEvent.click(canvas.getByRole("button", { name: t.retry }));
    await expect(args.onRetry).toHaveBeenCalledOnce();
  },
};
