import type { RouterOutputs } from "@v1/api";
import type { PostCardView } from "@v1/ui/recipes/forum/post-view";
import { postExcerpt, type TipTapNode } from "@/utils/post-excerpt";

export type PostListItem =
  RouterOutputs["forum"]["posts"]["list"]["items"][number];

/** A `forum.posts.list` item as the post card takes it. */
export function toPostCardView(post: PostListItem): PostCardView {
  const author = Array.isArray(post.author) ? post.author[0] : post.author;
  const hasBody = post.content && Object.keys(post.content).length > 0;

  return {
    id: post.id,
    href: `/posts/${post.id}`,
    title: post.title,
    excerpt: hasBody ? postExcerpt(post.content as TipTapNode) || null : null,
    authorName: author?.nickname ?? null,
    avatarUrl: author?.avatar_url ?? null,
    createdAt: post.created_at,
    likes: post.likes,
    dislikes: post.dislikes,
    commentCount: post.commentCount,
  };
}
