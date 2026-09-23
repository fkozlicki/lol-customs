import PostDetailsSkeleton from "@/components/forum/post-details-skeleton";

export default function PostLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-10 pb-16 sm:pt-16">
      <PostDetailsSkeleton />
    </div>
  );
}
