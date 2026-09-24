import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PostDetails } from "@/components/forum/post-details";
import PostDetailsSkeleton from "@/components/forum/post-details-skeleton";
import { PageShell } from "@/components/page-shell";
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
      <PageShell width="reading" gap="none">
        <Suspense fallback={<PostDetailsSkeleton />}>
          <PostDetails postId={id} />
        </Suspense>
      </PageShell>
    </HydrateClient>
  );
}
