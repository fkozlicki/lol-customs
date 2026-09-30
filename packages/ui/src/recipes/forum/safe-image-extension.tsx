"use client";

import { Image as ImageExtension } from "@tiptap/extension-image";
import {
  type NodeViewProps,
  NodeViewWrapper,
  ReactNodeViewRenderer,
} from "@tiptap/react";
import { SafeImage } from "./safe-image";

/** A post's image, behind the sensitive-content cover when the server flagged it. */
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

/** TipTap's image, carrying the nsfw flag and drawn through `SafeImage`. */
export const SafeImageExtension = ImageExtension.extend({
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
