import PostListSkeleton from "@v1/ui/recipes/forum/post-list-skeleton";
import { PageHeader } from "@v1/ui/recipes/page-header";
import { PageShell } from "@v1/ui/recipes/page-shell";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { PostList } from "@/components/forum/post-list";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

export default async function PostsPage() {
  const t = await getTranslations("dashboard.pages.posts");
  prefetch(
    trpc.forum.posts.list.infiniteQueryOptions(
      { limit: 20 },
      { getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined },
    ),
  );

  return (
    <HydrateClient>
      <PageShell width="list">
        <PageHeader title={t("title")} description={t("description")} />
        <Suspense fallback={<PostListSkeleton />}>
          <PostList />
        </Suspense>
      </PageShell>
    </HydrateClient>
  );
}
