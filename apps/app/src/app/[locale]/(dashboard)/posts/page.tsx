import { Suspense } from "react";
import { PostList } from "@/components/forum/post-list";
import PostListSkeleton from "@/components/forum/post-list-skeleton";
import { PageHeader } from "@/components/page-header";
import { getScopedI18n } from "@/locales/server";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

export default async function PostsPage() {
  const t = await getScopedI18n("dashboard.pages.posts");
  prefetch(
    trpc.forum.posts.list.infiniteQueryOptions(
      { limit: 20 },
      { getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined },
    ),
  );

  return (
    <HydrateClient>
      <div className="mx-auto w-full max-w-3xl space-y-10 px-4 pt-10 pb-16 sm:pt-16">
        <PageHeader title={t("title")} description={t("description")} />
        <Suspense fallback={<PostListSkeleton />}>
          <PostList />
        </Suspense>
      </div>
    </HydrateClient>
  );
}
