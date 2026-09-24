/** A TipTap document node, as much of it as the excerpt reads. */
export interface TipTapNode {
  type?: string;
  text?: string;
  content?: TipTapNode[];
}

/** Nodes whose children are inline: their text runs join with nothing between them. */
const TEXTBLOCKS = new Set(["paragraph", "heading", "codeBlock"]);

/** Ends a sentence, so the next block can follow after a plain space. */
const SENTENCE_END = /[.!?…:;]$/;

/**
 * Inline content concatenates as written. A mark splits a word into several text nodes — `**Kes**trel`
 * is two — so joining them with anything would put a space inside the word.
 */
function inlineText(node: TipTapNode): string {
  if (node.type === "hardBreak") return " ";
  if (typeof node.text === "string") return node.text;
  return (node.content ?? []).map(inlineText).join("");
}

function collectBlocks(node: TipTapNode, blocks: string[]): void {
  if (node.type && TEXTBLOCKS.has(node.type)) {
    const text = inlineText(node).replace(/\s+/g, " ").trim();
    if (text) blocks.push(text);
    return;
  }
  for (const child of node.content ?? []) collectBlocks(child, blocks);
}

/**
 * One line of plain text from a post body, for the post card.
 *
 * Blocks — paragraphs, a heading, each list item — keep a visible boundary. A block that ends a
 * sentence is followed by a space; one that does not, like a heading or a list item, by ` · `, the
 * separator the app uses everywhere else. Without it a heading and the list under it read as one
 * run-on sentence.
 */
export function postExcerpt(content: TipTapNode, maxLength = 160): string {
  const blocks: string[] = [];
  collectBlocks(content, blocks);

  const text = blocks.reduce(
    (line, block) =>
      line === ""
        ? block
        : `${line}${SENTENCE_END.test(line) ? " " : " · "}${block}`,
    "",
  );

  if (text.length <= maxLength) return text;
  // A cut can land on a separator; drop it rather than end on a dangling dot.
  return `${text.slice(0, maxLength).replace(/[\s·]+$/, "")}…`;
}
