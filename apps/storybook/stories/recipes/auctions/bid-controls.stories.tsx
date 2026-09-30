import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BidControls } from "@v1/ui/recipes/auctions/bid-controls";
import { expect, fn } from "storybook/test";
import { wordsFor } from "../../words";

const meta = {
  title: "Auctions/Bid controls",
  component: BidControls,
  parameters: { layout: "padded" },
  args: {
    minimumBid: 6,
    budget: 14,
    canBid: true,
    canConcede: true,
    busy: false,
    onBid: fn(),
    onConcede: fn(),
  },
} satisfies Meta<typeof BidControls>;

export default meta;

type Story = StoryObj<typeof meta>;

/** +1 bids the minimum, all-in the whole budget, and a typed amount only while it is within both. */
export const Bidding: Story = {
  play: async ({ args, canvas, globals, userEvent, step }) => {
    const t = wordsFor(globals).auctions.actions;
    const amount = canvas.getByRole("spinbutton", { name: t.customBid });
    const bid = () => canvas.getByRole("button", { name: new RegExp(t.bid) });

    await step("+1 bids one over the price", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "+1" }));
      await expect(args.onBid).toHaveBeenLastCalledWith(6);
    });
    await step("all-in bids the whole budget", async () => {
      await userEvent.click(canvas.getByRole("button", { name: t.allIn }));
      await expect(args.onBid).toHaveBeenLastCalledWith(14);
    });
    await step("an amount over the budget cannot be bid", async () => {
      await userEvent.clear(amount);
      await userEvent.type(amount, "20");
      await expect(bid()).toBeDisabled();
    });
    await step("an amount within it can", async () => {
      await userEvent.clear(amount);
      await userEvent.type(amount, "9");
      await userEvent.click(bid());
      await expect(args.onBid).toHaveBeenLastCalledWith(9);
    });
    await step("conceding hands the round over", async () => {
      await userEvent.click(canvas.getByRole("button", { name: t.concede }));
      await expect(args.onConcede).toHaveBeenCalledOnce();
    });
  },
};

/** The other captain leads, so this one cannot bid; conceding is still theirs to decide. */
export const Outbid: Story = {
  args: { canBid: false },
  play: async ({ canvas, globals }) => {
    const t = wordsFor(globals).auctions.actions;
    await expect(canvas.getByRole("button", { name: t.allIn })).toBeDisabled();
    await expect(canvas.getByRole("button", { name: t.concede })).toBeEnabled();
  },
};

/** While a bid is on its way, nothing can be pressed twice. */
export const Sending: Story = {
  args: { busy: true },
  play: async ({ canvas }) => {
    for (const button of canvas.getAllByRole("button")) {
      await expect(button).toBeDisabled();
    }
  },
};
