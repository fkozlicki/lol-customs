import { describe, expect, test } from "bun:test";
import { toPostCardView } from "./post-view";
import { POSTS } from "./posts.fixtures";

const [first] = POSTS;

describe("a post card", () => {
  test("links to the post", () => {
    expect(toPostCardView(first!).href).toBe(`/posts/${first!.id}`);
  });

  test("shows the body as a plain-text excerpt", () => {
    expect(toPostCardView(first!).excerpt).toStartWith(
      "Pięć meczów wczoraj, a Kestrel",
    );
  });

  test("has no excerpt for an empty body", () => {
    expect(toPostCardView({ ...first!, content: {} }).excerpt).toBeNull();
  });

  test("leaves an unresolved author for the card to name", () => {
    // The type says the join always finds one; a deleted profile says otherwise.
    const orphan = { ...first!, author: null } as never;
    expect(toPostCardView(orphan).authorName).toBeNull();
  });

  test("takes the author from a one-element array, as the join can return it", () => {
    expect(
      toPostCardView({ ...first!, author: [first!.author] } as never)
        .authorName,
    ).toBe("Kestrel");
  });
});
