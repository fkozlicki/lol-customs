/**
 * What a story test adds to a render. Storybook's Next preview installs React's `onCaughtError`, so a
 * story that throws while rendering does not fail: it renders empty and logs to the console. That is
 * how a broken `AuthorLine` story once shipped with every check green. So a story fails on any
 * `console.error`, and on rendering nothing at all.
 *
 * Animations are skipped: axe judges the state a story settles in, not a row halfway through fading in.
 */
import { MotionGlobalConfig } from "motion/react";
import { afterEach, beforeEach, vi } from "vitest";

MotionGlobalConfig.skipAnimations = true;

let errors: string[] = [];

beforeEach(() => {
  errors = [];
  vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
    errors.push(args.map(String).join(" ").split("\n")[0] ?? "");
  });
});

afterEach(() => {
  vi.mocked(console.error).mockRestore();
  if (errors.length > 0) {
    throw new Error(`The story logged an error: ${errors[0]}`);
  }
  // A dialog, sheet or menu renders into a portal on <body>, outside the story's root, so both count.
  const rendered = Array.from(document.body.children).some(
    (node) =>
      !["SCRIPT", "STYLE", "TEMPLATE", "NOSCRIPT"].includes(node.tagName) &&
      node.innerHTML.trim() !== "",
  );
  if (!rendered) throw new Error("The story rendered nothing.");
});
