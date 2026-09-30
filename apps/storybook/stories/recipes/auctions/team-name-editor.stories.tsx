import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TeamNameEditor } from "@v1/ui/recipes/auctions/team-name-editor";
import { expect, fn } from "storybook/test";
import { wordsFor } from "../../words";

const meta = {
  title: "Auctions/Team name editor",
  component: TeamNameEditor,
  parameters: { layout: "padded" },
  args: {
    initialName: "Night Owls",
    saving: false,
    onSave: fn(),
    onCancel: fn(),
  },
} satisfies Meta<typeof TeamNameEditor>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Enter saves what was typed; Escape gives up; an empty name cannot be saved. */
export const Renaming: Story = {
  play: async ({ args, canvas, globals, userEvent, step }) => {
    const t = wordsFor(globals).auctions.lobby;
    const field = canvas.getByRole("textbox", { name: t.teamName });

    await step("an empty name cannot be saved", async () => {
      await userEvent.clear(field);
      await expect(
        canvas.getByRole("button", { name: t.saveName }),
      ).toBeDisabled();
    });
    await step("Enter saves the new name", async () => {
      await userEvent.type(field, "Pierogi Gang{Enter}");
      await expect(args.onSave).toHaveBeenLastCalledWith("Pierogi Gang");
    });
    await step("Escape gives up", async () => {
      await userEvent.keyboard("{Escape}");
      await expect(args.onCancel).toHaveBeenCalledOnce();
    });
  },
};

/** While the new name is being saved. */
export const Saving: Story = {
  args: { saving: true },
  play: async ({ canvas, globals }) => {
    const t = wordsFor(globals).auctions.lobby;
    await expect(
      canvas.getByRole("button", { name: t.saveName }),
    ).toBeDisabled();
  },
};
