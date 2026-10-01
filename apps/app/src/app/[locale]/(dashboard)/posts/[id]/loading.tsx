import PostDetailsSkeleton from "@v1/ui/recipes/forum/post-details-skeleton";
import { PageShell } from "@v1/ui/recipes/page-shell";

export default function PostLoading() {
  return (
    <PageShell width="reading" gap="none">
      <PostDetailsSkeleton />
    </PageShell>
  );
}
