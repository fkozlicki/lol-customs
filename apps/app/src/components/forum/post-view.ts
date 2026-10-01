import type { RouterOutputs } from "@v1/api";
import type {
  CommentView,
  PostArticleView,
  PostCardView,
} from "@v1/ui/recipes/forum/post-view";
import { postExcerpt, type TipTapNode } from "@/utils/post-excerpt";

export type PostListItem =
  RouterOutputs["forum"]["posts"]["list"]["items"][number];
type Post = NonNullable<RouterOutputs["forum"]["posts"]["get"]>;
type Comment = RouterOutputs["forum"]["comments"]["list"]["items"][number];

interface Author {
  nickname: string | null;
  avatar_url: string | null;
}

/** The join returns the author as a row or a one-element array; a deleted profile, as nothing. */
function authorOf(author: Author | Author[] | null | undefined) {
  const resolved = Array.isArray(author) ? author[0] : author;
  return {
    authorName: resolved?.nickname ?? null,
    avatarUrl: resolved?.avatar_url ?? null,
  };
}

/** TipTap JSON with something in it; an empty object is an empty body. */
function body(content: unknown): Record<string, unknown> | null {
  return content && Object.keys(content).length > 0
    ? (content as Record<string, unknown>)
    : null;
}

/** A `forum.posts.list` item as the post card takes it. */
export function toPostCardView(post: PostListItem): PostCardView {
  const content = body(post.content);
  return {
    id: post.id,
    href: `/posts/${post.id}`,
    title: post.title,
    excerpt: content ? postExcerpt(content as TipTapNode) || null : null,
    ...authorOf(post.author),
    createdAt: post.created_at,
    likes: post.likes,
    dislikes: post.dislikes,
    commentCount: post.commentCount,
  };
}

/** A `forum.posts.get` result as the post's page takes it. */
export function toPostArticleView(post: Post): PostArticleView {
  return {
    title: post.title,
    ...authorOf(post.author),
    createdAt: post.created_at,
    content: body(post.content),
  };
}

/** A `forum.comments.list` item as the thread takes it. */
export function toCommentView(comment: Comment): CommentView {
  return {
    id: comment.id,
    ...authorOf(comment.author),
    createdAt: comment.created_at,
    content: comment.content as Record<string, unknown>,
  };
}
