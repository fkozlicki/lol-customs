import { describe, expect, test } from "bun:test";
import { toCommentView, toPostArticleView, toPostCardView } from "./post-view";
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

describe("a post's page", () => {
  const post = {
    ...first!,
    reactions: [],
  } as unknown as Parameters<typeof toPostArticleView>[0];

  test("carries the title, the author and the body", () => {
    expect(toPostArticleView(post)).toMatchObject({
      title: first!.title,
      authorName: first!.author.nickname,
      createdAt: first!.created_at,
    });
    expect(toPostArticleView(post).content).not.toBeNull();
  });

  test("has no body for an empty one", () => {
    expect(toPostArticleView({ ...post, content: {} }).content).toBeNull();
  });
});

describe("a comment", () => {
  const comment = {
    id: "c1",
    content: { type: "doc", content: [] },
    created_at: "2026-09-30T20:00:00Z",
    author: [{ nickname: "ola", avatar_url: null }],
  } as unknown as Parameters<typeof toCommentView>[0];

  test("takes its author from the join, one-element array or not", () => {
    expect(toCommentView(comment)).toEqual({
      id: "c1",
      authorName: "ola",
      avatarUrl: null,
      createdAt: "2026-09-30T20:00:00Z",
      content: { type: "doc", content: [] },
    });
  });

  test("leaves an unresolved author for the thread to name", () => {
    expect(
      toCommentView({ ...comment, author: null } as never).authorName,
    ).toBeNull();
  });
});
