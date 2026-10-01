import type { ReactNode } from "react";
import { EditorToolbar } from "./editor-toolbar";

type RichTextFrameProps = Parameters<typeof EditorToolbar>[0] & {
  /** The editing surface, which the app's editor renders. */
  children: ReactNode;
};

/** The rich text editor's frame: its toolbar above the editing surface. */
export function RichTextFrame({ children, ...toolbar }: RichTextFrameProps) {
  return (
    <div className="rounded-md border border-input bg-background">
      <EditorToolbar {...toolbar} />
      {children}
    </div>
  );
}
