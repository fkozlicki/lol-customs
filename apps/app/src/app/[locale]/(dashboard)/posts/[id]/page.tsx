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
      <div className="mx-auto w-full max-w-3xl px-4 pt-10 pb-16 sm:pt-16">
        <Suspense fallback={<PostDetailsSkeleton />}>
          <PostDetails postId={id} />
        </Suspense>
      </div>
    </HydrateClient>
  );
}
