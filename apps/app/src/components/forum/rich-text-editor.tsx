"use client";

import { useMutation } from "@tanstack/react-query";
import { Image } from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { createClient } from "@v1/supabase/client";
import { Button } from "@v1/ui/button";
import { cn } from "@v1/ui/cn";
import { Icons } from "@v1/ui/icons";
import { toast } from "@v1/ui/sonner";
import { useRef } from "react";
import { useTRPC } from "@/trpc/react";

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

interface RichTextEditorProps {
  onChange: (json: Record<string, unknown>) => void;
  placeholder?: string;
  userId: string;
}

export function RichTextEditor({
  onChange,
  placeholder = "Write something...",
  userId,
}: RichTextEditorProps) {
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

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be smaller than 10MB");
      return;
    }

    const supabase = createClient();
    const ext = file.name.split(".").pop() ?? "jpg";
    const filename = `${Date.now()}.${ext}`;
    const path = `${userId}/${filename}`;

    const { error } = await supabase.storage
      .from("forum-images")
      .upload(path, file);

    if (error) {
      toast.error("Failed to upload image");
      return;
    }

    const { data } = supabase.storage.from("forum-images").getPublicUrl(path);
    const publicUrl = data.publicUrl;

    // Check NSFW server-side; fail closed (treat as nsfw) if the call errors
    let isNsfw = false;
    try {
      const result = await checkNsfw.mutateAsync({ url: publicUrl });
      isNsfw = result.isNsfw;
    } catch {
      isNsfw = true;
    }

    editor
      .chain()
      .focus()
      .insertContent({ type: "image", attrs: { src: publicUrl, nsfw: isNsfw } })
      .run();

    // reset input so the same file can be re-selected
    e.target.value = "";
  }

  if (!editor) return null;

  return (
    <div className="rounded-md border border-input bg-background">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border px-2 py-1">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          aria-label="Bold"
        >
          <Icons.Bold className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          aria-label="Italic"
        >
          <Icons.Italic className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          active={editor.isActive("heading", { level: 2 })}
          aria-label="Heading"
        >
          <Icons.Heading2 className="size-4" />
        </ToolbarButton>
        <div className="mx-1 h-4 w-px bg-border" />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          aria-label="Bullet list"
        >
          <Icons.List className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          aria-label="Ordered list"
        >
          <Icons.ListOrdered className="size-4" />
        </ToolbarButton>
        <div className="mx-1 h-4 w-px bg-border" />
        <ToolbarButton
          onClick={() => fileInputRef.current?.click()}
          aria-label="Insert image"
        >
          <Icons.Image className="size-4" />
        </ToolbarButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarButton({
  children,
  onClick,
  active,
  ...props
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={cn("size-7", active && "bg-accent text-accent-foreground")}
      {...props}
    >
      {children}
    </Button>
  );
}
