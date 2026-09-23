import PostListSkeleton from "@/components/forum/post-list-skeleton";
import { PageHeaderSkeleton } from "@/components/page-header";

export default function PostsLoading() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-10 px-4 pt-10 pb-16 sm:pt-16">
      <PageHeaderSkeleton />
      <PostListSkeleton />
    </div>
  );
}
