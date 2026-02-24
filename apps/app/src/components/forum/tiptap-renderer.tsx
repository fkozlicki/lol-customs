"use client";

import { generateHTML } from "@tiptap/core";
import { Image } from "@tiptap/extension-image";
import StarterKit from "@tiptap/starter-kit";
import { useMemo } from "react";

interface TipTapRendererProps {
  content: Record<string, unknown>;
}

export function TipTapRenderer({ content }: TipTapRendererProps) {
  const html = useMemo(() => {
    try {
      return generateHTML(content as Parameters<typeof generateHTML>[0], [
        StarterKit,
        Image,
      ]);
    } catch {
      return "";
    }
  }, [content]);

  return (
    <div
      className="prose prose-sm dark:prose-invert max-w-none [&_img]:rounded-md [&_img]:max-w-full"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
