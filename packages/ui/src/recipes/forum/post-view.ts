/**
 * A forum post as the post card draws it. The app makes one from a `forum.posts.list` item with
 * `toPostCardView` (apps/app/src/components/forum/post-view.ts); stories make one by hand.
 */
export interface PostCardView {
  id: string;
  href: string;
  title: string;
  /** Plain text of the body's opening; null for an empty body. */
  excerpt: string | null;
  /** Null when the author could not be resolved; the card says so in the reader's language. */
  authorName: string | null;
  avatarUrl: string | null;
  /** ISO timestamp, shown as how long ago. */
  createdAt: string;
  likes: number;
  dislikes: number;
  commentCount: number;
}

/** A post as its page shows it. */
export interface PostArticleView {
  title: string;
  authorName: string | null;
  avatarUrl: string | null;
  createdAt: string;
  /** The body as TipTap JSON; null for an empty one. */
  content: Record<string, unknown> | null;
}

/** A comment under a post. */
export interface CommentView {
  id: string;
  authorName: string | null;
  avatarUrl: string | null;
  createdAt: string;
  content: Record<string, unknown>;
}
