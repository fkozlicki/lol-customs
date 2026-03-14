"use client";

import { Image as ImageExtension } from "@tiptap/extension-image";
import type { NodeViewProps } from "@tiptap/react";
import {
  EditorContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  useEditor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";
import { SafeImage } from "./safe-image";

function ImageNodeView({ node }: NodeViewProps) {
  return (
    <NodeViewWrapper>
      <SafeImage
        src={node.attrs.src as string}
        alt={(node.attrs.alt as string | undefined) ?? ""}
        initialNsfw={node.attrs.nsfw === true}
        className="rounded-md max-w-full"
      />
    </NodeViewWrapper>
  );
}

const SafeImageExtension = ImageExtension.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      nsfw: {
        default: false,
        parseHTML: (el) => el.getAttribute("data-nsfw") === "true",
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
});

interface TipTapRendererProps {
  content: Record<string, unknown>;
}

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
