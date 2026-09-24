import { describe, expect, test } from "bun:test";
import { postExcerpt, type TipTapNode } from "./post-excerpt";

const text = (value: string, ...marks: string[]): TipTapNode => ({
  type: "text",
  text: value,
  ...(marks.length ? { marks: marks.map((type) => ({ type })) } : {}),
});
const paragraph = (...content: TipTapNode[]): TipTapNode => ({
  type: "paragraph",
  content,
});
const heading = (value: string): TipTapNode => ({
  type: "heading",
  content: [text(value)],
});
const list = (...items: string[]): TipTapNode => ({
  type: "bulletList",
  content: items.map((item) => ({
    type: "listItem",
    content: [paragraph(text(item))],
  })),
});
const doc = (...content: TipTapNode[]): TipTapNode => ({
  type: "doc",
  content,
});

describe("postExcerpt", () => {
  test("keeps a word whole when a mark covers part of it", () => {
    expect(
      postExcerpt(doc(paragraph(text("Kes", "bold"), text("trel wins")))),
    ).toBe("Kestrel wins");
  });

  test("does not double the spaces around a marked word", () => {
    expect(
      postExcerpt(
        doc(paragraph(text("and "), text("Kestrel", "bold"), text(" wins"))),
      ),
    ).toBe("and Kestrel wins");
  });

  test("separates blocks that do not end a sentence", () => {
    expect(
      postExcerpt(
        doc(heading("Who is in"), list("Quill — confirmed", "Bramble — late")),
      ),
    ).toBe("Who is in · Quill — confirmed · Bramble — late");
  });

  test("joins a finished sentence to the next block with a plain space", () => {
    expect(
      postExcerpt(
        doc(paragraph(text("Friday at eight.")), heading("Who is in")),
      ),
    ).toBe("Friday at eight. Who is in");
  });

  test("reads a hard break as a space", () => {
    expect(
      postExcerpt(
        doc(paragraph(text("one"), { type: "hardBreak" }, text("two"))),
      ),
    ).toBe("one two");
  });

  test("skips nodes with no text, such as images", () => {
    expect(
      postExcerpt(
        doc(
          paragraph(text("before")),
          { type: "image" },
          paragraph(text("after")),
        ),
      ),
    ).toBe("before · after");
  });

  test("is empty for an empty document", () => {
    expect(postExcerpt(doc())).toBe("");
  });

  test("cuts long text with an ellipsis", () => {
    const excerpt = postExcerpt(doc(paragraph(text("word ".repeat(60)))), 20);
    expect(excerpt.endsWith("…")).toBe(true);
    expect(excerpt.length).toBeLessThanOrEqual(21);
  });

  test("never ends a cut excerpt on a separator", () => {
    const excerpt = postExcerpt(doc(heading("aaaa"), heading("bbbb")), 6);
    expect(excerpt).toBe("aaaa…");
  });
});
