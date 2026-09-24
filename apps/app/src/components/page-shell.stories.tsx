import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PageHeader } from "./page-header";
import { PageShell } from "./page-shell";

const meta = {
  title: "Page shell",
  component: PageShell,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof PageShell>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The dashed rule marks the measure; the padding is the same at every width. */
function Measure({ label }: { label: string }) {
  return (
    <>
      <PageHeader
        title={label}
        description="The shell sets the measure only."
      />
      <div className="border border-dashed p-6">
        <p className="label-caps">Content</p>
      </div>
      <div className="border border-dashed p-6">
        <p className="label-caps">Another block, one gap below</p>
      </div>
    </>
  );
}

export const Wide: Story = {
  args: { children: <Measure label="Standings" /> },
};

/** The forum list: a narrower measure so lines of prose stay readable. */
export const List: Story = {
  args: { width: "list", children: <Measure label="Forum" /> },
};

/** A single post. */
export const Reading: Story = {
  args: { width: "reading", children: <Measure label="Post" /> },
};

/** Pages that do their own spacing opt out of the rhythm rather than fighting it. */
export const NoGap: Story = {
  args: { gap: "none", children: <Measure label="Own spacing" /> },
};
