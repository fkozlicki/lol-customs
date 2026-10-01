import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "@v1/ui/button";
import { AuctionSummaryList } from "@v1/ui/recipes/auctions/auction-summary-list";
import { expect } from "storybook/test";
import { slots } from "../../controls";
import { AUCTIONS } from "./auction-list.fixtures";

/** The auction list's body. The app passes its create button as `emptyAction`; here it is a stand-in. */
const meta = {
  title: "Auctions/Summary list",
  component: AuctionSummaryList,
  argTypes: { ...slots("emptyAction") },
  parameters: { layout: "padded" },
  args: { auctions: AUCTIONS },
} satisfies Meta<typeof AuctionSummaryList>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A live auction, pulsing, with the player on the stage and the price; a lobby waiting for a captain. */
export const Auctions: Story = {};

/** No lobby and no live auction: the invitation, with the action the app offers under it. */
export const Empty: Story = {
  args: {
    auctions: [],
    emptyAction: <Button variant="outline">Create auction</Button>,
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("button", { name: "Create auction" }),
    ).toBeVisible();
  },
};
