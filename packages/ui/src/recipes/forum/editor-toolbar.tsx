"use client";

import { useTranslations } from "next-intl";
import { Icons } from "../../components/icons";
import { EditorToolbarButton } from "./editor-toolbar-button";

export type EditorFormat =
  | "bold"
  | "italic"
  | "heading"
  | "bulletList"
  | "orderedList";

const FORMATS = [
  { format: "bold", icon: Icons.Bold },
  { format: "italic", icon: Icons.Italic },
  { format: "heading", icon: Icons.Heading2 },
  { format: "bulletList", icon: Icons.List },
  { format: "orderedList", icon: Icons.ListOrdered },
] as const;

interface EditorToolbarProps {
  /** Which formats apply where the cursor is. */
  active: Record<EditorFormat, boolean>;
  onToggle: (format: EditorFormat) => void;
  onInsertImage: () => void;
}

/** Bold, italic and a heading; two kinds of list; an image. */
export function EditorToolbar({
  active,
  onToggle,
  onInsertImage,
}: EditorToolbarProps) {
  const t = useTranslations("forum.editor");
  const button = ({ format, icon: Icon }: (typeof FORMATS)[number]) => (
    <EditorToolbarButton
      key={format}
      label={t(format)}
      active={active[format]}
      onClick={() => onToggle(format)}
    >
      <Icon className="size-4" />
    </EditorToolbarButton>
  );

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border px-2 py-1">
      {FORMATS.slice(0, 3).map(button)}
      <div className="mx-1 h-4 w-px bg-border" />
      {FORMATS.slice(3).map(button)}
      <div className="mx-1 h-4 w-px bg-border" />
      <EditorToolbarButton label={t("image")} onClick={onInsertImage}>
        <Icons.Image className="size-4" />
      </EditorToolbarButton>
    </div>
  );
}
