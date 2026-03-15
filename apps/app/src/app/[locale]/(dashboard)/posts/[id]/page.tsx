import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PostDetails } from "@/components/forum/post-details";
import PostDetailsSkeleton from "@/components/forum/post-details-skeleton";
import { caller, HydrateClient, prefetch, trpc } from "@/trpc/server";

interface PostPageProps {
  params: Promise<{ id: string }>;
}

export default async function PostPage({ params }: PostPageProps) {
  const { id } = await params;

  const post = await caller.forum.posts.get({ id });

  if (!post) notFound();

  prefetch(trpc.forum.comments.list.queryOptions({ postId: id }));

  return (
    <HydrateClient>
      <div className="p-4 max-w-3xl mx-auto w-full pb-12">
        <Suspense fallback={<PostDetailsSkeleton />}>
          <PostDetails postId={id} />
        </Suspense>
      </div>
    </HydrateClient>
  );
}
