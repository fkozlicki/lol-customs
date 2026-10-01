"use client";

import { useMutation } from "@tanstack/react-query";
import { Image } from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { type Editor, EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { createClient } from "@v1/supabase/client";
import type { EditorFormat } from "@v1/ui/recipes/forum/editor-toolbar";
import { RichTextFrame } from "@v1/ui/recipes/forum/rich-text-frame";
import { toast } from "@v1/ui/sonner";
import { useTranslations } from "next-intl";
import { forwardRef, useImperativeHandle, useRef } from "react";
import { useTRPC } from "@/trpc/react";

export interface RichTextEditorHandle {
  clearContent: () => void;
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

// Extend Image to carry the server-side nsfw flag through TipTap JSON
const NsfwImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      nsfw: {
        default: false,
        parseHTML: (el) => el.getAttribute("data-nsfw") === "true",
        renderHTML: (attrs) => (attrs.nsfw ? { "data-nsfw": "true" } : {}),
      },
    };
  },
});

/** Each toolbar format: whether it applies at the cursor, and how to toggle it. */
const FORMATS: Record<
  EditorFormat,
  { isActive: (editor: Editor) => boolean; toggle: (editor: Editor) => void }
> = {
  bold: {
    isActive: (editor) => editor.isActive("bold"),
    toggle: (editor) => editor.chain().focus().toggleBold().run(),
  },
  italic: {
    isActive: (editor) => editor.isActive("italic"),
    toggle: (editor) => editor.chain().focus().toggleItalic().run(),
  },
  heading: {
    isActive: (editor) => editor.isActive("heading", { level: 2 }),
    toggle: (editor) =>
      editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  bulletList: {
    isActive: (editor) => editor.isActive("bulletList"),
    toggle: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  orderedList: {
    isActive: (editor) => editor.isActive("orderedList"),
    toggle: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
};

interface RichTextEditorProps {
  onChange: (json: Record<string, unknown>) => void;
  placeholder: string;
  /** Images upload under the author's folder. */
  userId: string;
}

/**
 * The forum's editor: TipTap with images, which upload to storage and get an NSFW check before
 * they are inserted.
 */
export const RichTextEditor = forwardRef<
  RichTextEditorHandle,
  RichTextEditorProps
>(function RichTextEditor({ onChange, placeholder, userId }, ref) {
  const t = useTranslations("dashboard.pages.posts.imageUpload");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const trpc = useTRPC();

  const checkNsfw = useMutation(trpc.forum.images.checkNsfw.mutationOptions());

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      NsfwImage.configure({ allowBase64: false }),
      Placeholder.configure({ placeholder }),
    ],
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON() as Record<string, unknown>);
    },
    editorProps: {
      attributes: {
        class:
          "min-h-[200px] px-3 py-2 focus:outline-none prose prose-sm dark:prose-invert max-w-none",
      },
    },
  });

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    if (file.size > MAX_IMAGE_BYTES) {
      toast.error(t("tooLarge"));
      return;
    }

    const supabase = createClient();
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("forum-images")
      .upload(path, file);

    if (error) {
      toast.error(t("failed"));
      return;
    }

    const { data } = supabase.storage.from("forum-images").getPublicUrl(path);

    // Check NSFW server-side; fail closed (treat as nsfw) if the call errors
    let isNsfw = false;
    try {
      const result = await checkNsfw.mutateAsync({ url: data.publicUrl });
      isNsfw = result.isNsfw;
    } catch {
      isNsfw = true;
    }

    editor
      .chain()
      .focus()
      .insertContent({
        type: "image",
        attrs: { src: data.publicUrl, nsfw: isNsfw },
      })
      .run();

    // reset input so the same file can be re-selected
    e.target.value = "";
  }

  useImperativeHandle(ref, () => ({
    clearContent: () => {
      editor?.commands.clearContent(true);
    },
  }));

  if (!editor) return null;

  const active = Object.fromEntries(
    Object.entries(FORMATS).map(([format, { isActive }]) => [
      format,
      isActive(editor),
    ]),
  ) as Record<EditorFormat, boolean>;

  return (
    <RichTextFrame
      active={active}
      onToggle={(format) => FORMATS[format].toggle(editor)}
      onInsertImage={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />
      <EditorContent editor={editor} />
    </RichTextFrame>
  );
});
