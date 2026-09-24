import PostDetailsSkeleton from "@/components/forum/post-details-skeleton";
import { PageShell } from "@/components/page-shell";

export default function PostLoading() {
  return (
    <PageShell width="reading" gap="none">
      <PostDetailsSkeleton />
    </PageShell>
  );
}
