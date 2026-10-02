import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NotFound } from "@v1/ui/recipes/not-found";
import { expect } from "storybook/test";
import { wordsFor } from "../words";

/** The dashboard's 404: a post, a room or a player that does not exist, and the way home. */
const meta = {
  title: "Not found",
  component: NotFound,
  parameters: { layout: "padded" },
  args: { homeHref: "/" },
} satisfies Meta<typeof NotFound>;

export default meta;

export const Missing: StoryObj<typeof meta> = {
  play: async ({ canvas, globals }) => {
    const t = wordsFor(globals).notFound;
    await expect(canvas.getByRole("link", { name: t.home })).toHaveAttribute(
      "href",
      "/",
    );
  },
};
