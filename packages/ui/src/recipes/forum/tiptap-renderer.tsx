"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";
import { SafeImageExtension } from "./safe-image-extension";

interface TipTapRendererProps {
  content: Record<string, unknown>;
}

/** A post or comment body, read-only. */
export function TipTapRenderer({ content }: TipTapRendererProps) {
  const editor = useEditor({
    immediatelyRender: false,
    editable: false,
    extensions: [
      StarterKit.configure({
        paragraph: {
          HTMLAttributes: {
            class: "break-all",
          },
        },
      }),
      SafeImageExtension,
    ],
    content,
    editorProps: {
      attributes: {
        class: "prose prose-sm dark:prose-invert max-w-none",
      },
    },
  });

  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  return <EditorContent editor={editor} />;
}
