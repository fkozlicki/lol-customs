import PostListSkeleton from "@v1/ui/recipes/forum/post-list-skeleton";
import { PageHeaderSkeleton } from "@v1/ui/recipes/page-header-skeleton";
import { PageShell } from "@v1/ui/recipes/page-shell";

export default function PostsLoading() {
  return (
    <PageShell width="list">
      <PageHeaderSkeleton />
      <PostListSkeleton />
    </PageShell>
  );
}
