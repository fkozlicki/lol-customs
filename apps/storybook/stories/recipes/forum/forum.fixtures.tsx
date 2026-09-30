/** Comments and a stand-in editor for the forum's stories. Names invented. */
import type { CommentView } from "@v1/ui/recipes/forum/post-view";
import { RichTextFrame } from "@v1/ui/recipes/forum/rich-text-frame";
import { fn } from "storybook/test";

const paragraph = (text: string) => ({
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text }] }],
});

export const COMMENTS: CommentView[] = [
  {
    id: "c1",
    authorName: "Old Tom",
    avatarUrl: null,
    createdAt: "2026-09-19T08:10:00Z",
    content: paragraph("Następnym razem biorę go do drużyny, obiecuję."),
  },
  {
    id: "c2",
    authorName: null,
    avatarUrl: null,
    createdAt: "2026-09-19T09:40:00Z",
    content: paragraph("Ten baron to był rzut monetą."),
  },
];

/** The editor as the app renders it, minus TipTap: its toolbar over an empty surface. */
export function StandInEditor({ placeholder }: { placeholder: string }) {
  return (
    <RichTextFrame
      active={{
        bold: false,
        italic: false,
        heading: false,
        bulletList: false,
        orderedList: false,
      }}
      onToggle={fn()}
      onInsertImage={fn()}
    >
      <div className="min-h-[120px] px-3 py-2 text-sm text-muted-foreground">
        {placeholder}
      </div>
    </RichTextFrame>
  );
}
