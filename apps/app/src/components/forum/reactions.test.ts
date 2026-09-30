import { describe, expect, test } from "bun:test";
import { myReaction, withReactionToggled } from "./reactions";

const post = {
  id: "post-1",
  likes: 1,
  dislikes: 1,
  reactions: [
    { type: "like", user_id: "ola" },
    { type: "dislike", user_id: "kasia" },
  ],
};

describe("toggling a reaction", () => {
  test("adds it when the reader had none, and counts it", () => {
    const next = withReactionToggled(post, "wren", "like");
    expect(next.reactions).toContainEqual({ type: "like", user_id: "wren" });
    expect(next).toMatchObject({ likes: 2, dislikes: 1 });
  });

  test("takes it back when the reader had the same one", () => {
    const next = withReactionToggled(post, "ola", "like");
    expect(next.reactions).toEqual([{ type: "dislike", user_id: "kasia" }]);
    expect(next).toMatchObject({ likes: 0, dislikes: 1 });
  });

  test("swaps it when the reader had the other one", () => {
    const next = withReactionToggled(post, "kasia", "like");
    expect(myReaction(next.reactions, "kasia")).toBe("like");
    expect(next).toMatchObject({ likes: 2, dislikes: 0 });
  });

  test("keeps the rest of what was reacted to", () => {
    expect(withReactionToggled(post, "wren", "dislike").id).toBe("post-1");
  });
});

test("a signed-out reader has no reaction", () => {
  expect(myReaction(post.reactions, null)).toBeNull();
  expect(myReaction(post.reactions, "wren")).toBeNull();
  expect(myReaction(post.reactions, "ola")).toBe("like");
});
