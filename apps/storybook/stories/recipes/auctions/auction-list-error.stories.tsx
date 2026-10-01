import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "@v1/ui/button";
import { AuctionListError } from "@v1/ui/recipes/auctions/auction-list-error";
import { expect } from "storybook/test";
import { slots } from "../../controls";

/** The app passes its retry button as `action`; here it is a stand-in. */
const meta = {
  title: "Auctions/List error",
  component: AuctionListError,
  argTypes: { ...slots("action") },
  parameters: { layout: "padded" },
  args: { action: <Button variant="outline">Try again</Button> },
} satisfies Meta<typeof AuctionListError>;

export default meta;

/** The list could not be loaded, with the way to try again under the message. */
export const LoadFailed: StoryObj<typeof meta> = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("button", { name: "Try again" }),
    ).toBeVisible();
  },
};
