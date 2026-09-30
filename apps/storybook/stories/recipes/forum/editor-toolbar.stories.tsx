import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EditorToolbar } from "@v1/ui/recipes/forum/editor-toolbar";
import { expect, fn } from "storybook/test";
import { wordsFor } from "../../words";

const meta = {
  title: "Forum/Editor toolbar",
  component: EditorToolbar,
  args: {
    active: {
      bold: true,
      italic: false,
      heading: false,
      bulletList: false,
      orderedList: false,
    },
    onToggle: fn(),
    onInsertImage: fn(),
  },
} satisfies Meta<typeof EditorToolbar>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A format that applies at the cursor is lit and pressed; each button toggles its format. */
export const Toolbar: Story = {
  play: async ({ args, canvas, globals, userEvent }) => {
    const t = wordsFor(globals).forum.editor;
    await expect(canvas.getByRole("button", { name: t.bold })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await userEvent.click(canvas.getByRole("button", { name: t.bulletList }));
    await expect(args.onToggle).toHaveBeenCalledWith("bulletList");
    await userEvent.click(canvas.getByRole("button", { name: t.image }));
    await expect(args.onInsertImage).toHaveBeenCalledOnce();
  },
};
