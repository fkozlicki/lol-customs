import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SafeImage } from "./safe-image";

/** An inline SVG, so the story does not depend on a network image. */
const PICTURE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="gray"/><text x="320" y="190" font-size="32" text-anchor="middle" fill="white" font-family="monospace">screenshot</text></svg>`, // design-check-ignore: a stand-in picture, not a UI colour.
  );

const meta = {
  title: "Forum/Safe image",
  component: SafeImage,
  parameters: { layout: "padded" },
  args: { src: PICTURE, alt: "A screenshot from the match", className: "w-96" },
} satisfies Meta<typeof SafeImage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/**
 * Flagged by the NSFW check at upload, so it starts hidden behind a notice and a reveal button.
 * The check fails closed: an error during classification also lands here.
 */
export const Flagged: Story = {
  args: { initialNsfw: true },
};
