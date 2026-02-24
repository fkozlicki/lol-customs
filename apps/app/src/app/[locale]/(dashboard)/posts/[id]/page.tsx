import { Skeleton } from "@v1/ui/skeleton";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PostDetail } from "@/components/forum/post-detail";
import { getQueryClient, HydrateClient, trpc } from "@/trpc/server";

interface PostPageProps {
  params: Promise<{ id: string }>;
}

function PostDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <Skeleton className="h-px w-full" />
      <div className="space-y-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  );
}

export default async function PostPage({ params }: PostPageProps) {
  const { id } = await params;
  const queryClient = getQueryClient();

  const post = await queryClient
    .fetchQuery(trpc.forum.posts.get.queryOptions({ id }))
    .catch(() => null);

  if (!post) notFound();

  await queryClient.prefetchQuery(
    trpc.forum.comments.list.queryOptions({ postId: id }),
  );

  return (
    <HydrateClient>
      <div className="p-4 max-w-3xl mx-auto w-full pb-12">
        <Suspense fallback={<PostDetailSkeleton />}>
          <PostDetail postId={id} />
        </Suspense>
      </div>
    </HydrateClient>
  );
}
