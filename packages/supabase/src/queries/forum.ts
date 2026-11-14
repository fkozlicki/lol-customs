import "server-only";
import type { Client, ForumContent } from "../types";

export type ReactionType = "like" | "dislike";

const AUTHOR = "author:user_profiles!author_id(id, nickname, avatar_url)";

function countReactions(reactions: { type: string }[]) {
  return {
    likes: reactions.filter((r) => r.type === "like").length,
    dislikes: reactions.filter((r) => r.type === "dislike").length,
  };
}

/** A page of posts, newest first, with their reaction and comment counts. */
export async function listPosts(
  client: Client,
  args: { limit: number; cursor?: string },
) {
  let query = client
    .from("forum_post_list")
    .select(
      `id, title, content, created_at, ${AUTHOR}, likes, dislikes, comment_count`,
    )
    .order("created_at", { ascending: false })
    .limit(args.limit + 1);
  if (args.cursor) {
    query = query.lt("created_at", args.cursor);
  }
  const { data, error } = await query;
  if (error) throw error;

  const items = data.map(({ comment_count, ...post }) => ({
    ...post,
    commentCount: comment_count,
  }));
  const hasNextPage = items.length > args.limit;
  const lastItem = hasNextPage ? items[args.limit - 1] : undefined;

  return {
    items: items.slice(0, args.limit),
    nextCursor: lastItem?.created_at ?? null,
  };
}

/** One post with its counts and who reacted how; null if there is no such post. */
export async function getPost(client: Client, id: string) {
  const { data, error } = await client
    .from("forum_post_list")
    .select(
      `id, title, content, created_at, ${AUTHOR}, reactions:forum_reactions(type, user_id), likes, dislikes, comment_count`,
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const { comment_count, ...post } = data;
  return { ...post, commentCount: comment_count };
}

export async function createPost(
  client: Client,
  post: { author_id: string; title: string; content: ForumContent },
) {
  const { data, error } = await client
    .from("forum_posts")
    .insert(post)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** A page of a post's comments, oldest first, with who reacted how. */
export async function listComments(
  client: Client,
  args: { postId: string; limit: number; cursor?: string },
) {
  let query = client
    .from("forum_comments")
    .select(
      `id, content, created_at, ${AUTHOR}, reactions:forum_comment_reactions(type, user_id)`,
    )
    .eq("post_id", args.postId)
    .order("created_at", { ascending: true })
    .limit(args.limit + 1);
  if (args.cursor) {
    query = query.gt("created_at", args.cursor);
  }
  const { data, error } = await query;
  if (error) throw error;

  const items = data.map((comment) => ({
    ...comment,
    ...countReactions(comment.reactions),
  }));
  const hasNextPage = items.length > args.limit;
  const lastItem = hasNextPage ? items[args.limit - 1] : undefined;

  return {
    items: items.slice(0, args.limit),
    nextCursor: lastItem?.created_at ?? null,
  };
}

export async function createComment(
  client: Client,
  comment: { post_id: string; author_id: string; content: ForumContent },
) {
  const { data, error } = await client
    .from("forum_comments")
    .insert(comment)
    .select(`id, content, created_at, ${AUTHOR}`)
    .single();
  if (error) throw error;
  return data;
}

/** The user's reaction to one post or comment, as the four things the toggle does with it. */
function reactionRow(
  client: Client,
  target: { postId: string } | { commentId: string },
  userId: string,
) {
  if ("postId" in target) {
    const key = { post_id: target.postId, user_id: userId };
    const table = () => client.from("forum_reactions");
    return {
      find: () => table().select("type").match(key).maybeSingle(),
      remove: () => table().delete().match(key),
      change: (type: ReactionType) => table().update({ type }).match(key),
      add: (type: ReactionType) => table().insert({ ...key, type }),
    };
  }
  const key = { comment_id: target.commentId, user_id: userId };
  const table = () => client.from("forum_comment_reactions");
  return {
    find: () => table().select("type").match(key).maybeSingle(),
    remove: () => table().delete().match(key),
    change: (type: ReactionType) => table().update({ type }).match(key),
    add: (type: ReactionType) => table().insert({ ...key, type }),
  };
}

/**
 * Sets the user's reaction to a post or a comment: the same reaction again takes it back, the other
 * one replaces it.
 */
export async function toggleReaction(
  client: Client,
  target: { postId: string } | { commentId: string },
  userId: string,
  type: ReactionType,
) {
  const row = reactionRow(client, target, userId);
  const { data: existing, error } = await row.find();
  if (error) throw error;

  const action = !existing
    ? "added"
    : existing.type === type
      ? "removed"
      : "updated";
  const write =
    action === "added"
      ? row.add(type)
      : action === "removed"
        ? row.remove()
        : row.change(type);
  const { error: writeError } = await write;
  if (writeError) throw writeError;
  return { action };
}
