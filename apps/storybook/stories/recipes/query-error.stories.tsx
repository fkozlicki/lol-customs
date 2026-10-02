import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "@v1/ui/button";
import { QueryError } from "@v1/ui/recipes/query-error";
import { expect } from "storybook/test";
import { slots } from "../controls";

/**
 * What a page shows in place of a block whose query failed, unless the block has an error of its own.
 * The app passes its retry button as `action`; here it is a stand-in.
 */
const meta = {
  title: "Query error",
  component: QueryError,
  argTypes: { ...slots("action") },
  parameters: { layout: "padded" },
  args: { action: <Button variant="outline">Try again</Button> },
} satisfies Meta<typeof QueryError>;

export default meta;

export const LoadFailed: StoryObj<typeof meta> = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("button", { name: "Try again" }),
    ).toBeVisible();
  },
};
