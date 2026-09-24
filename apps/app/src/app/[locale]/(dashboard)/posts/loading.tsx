import PostListSkeleton from "@/components/forum/post-list-skeleton";
import { PageHeaderSkeleton } from "@/components/page-header";
import { PageShell } from "@/components/page-shell";

export default function PostsLoading() {
  return (
    <PageShell width="list">
      <PageHeaderSkeleton />
      <PostListSkeleton />
    </PageShell>
  );
}
