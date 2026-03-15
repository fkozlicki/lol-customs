import { Suspense } from "react";
import { PostList } from "@/components/forum/post-list";
import PostListSkeleton from "@/components/forum/post-list-skeleton";
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
      <div className="space-y-6 p-4 max-w-3xl mx-auto w-full">
        <div>
          <h1 className="text-2xl font-semibold ">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <Suspense fallback={<PostListSkeleton />}>
          <PostList />
        </Suspense>
      </div>
    </HydrateClient>
  );
}
