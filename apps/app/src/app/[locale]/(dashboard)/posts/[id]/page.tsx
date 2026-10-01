import PostDetailsSkeleton from "@v1/ui/recipes/forum/post-details-skeleton";
import { PageShell } from "@v1/ui/recipes/page-shell";
import { notFound } from "next/navigation";
import { PostDetails } from "@/components/forum/post-details";
import { QueryBoundary } from "@/components/query-boundary";
import {
  getQueryClient,
  HydrateClient,
  prefetch,
  trpc,
} from "@/trpc/server";

interface PostPageProps {
  params: Promise<{ id: string }>;
}

export default async function PostPage({ params }: PostPageProps) {
  const { id } = await params;
  const queryClient = getQueryClient();
  const postQuery = trpc.forum.posts.get.queryOptions({ id });

  // Awaited so a missing post is a 404; prefetchQuery does not throw, so a failure reaches the boundary.
  await queryClient.prefetchQuery(postQuery);
  if (queryClient.getQueryData(postQuery.queryKey) === null) notFound();

  prefetch(trpc.forum.comments.list.queryOptions({ postId: id }));

  return (
    <HydrateClient>
      <PageShell width="reading" gap="none">
        <QueryBoundary fallback={<PostDetailsSkeleton />}>
          <PostDetails postId={id} />
        </QueryBoundary>
      </PageShell>
    </HydrateClient>
  );
}
