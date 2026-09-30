import { Skeleton } from "../components/skeleton";

/** Matches PageHeader while the page loads. */
export function PageHeaderSkeleton({ eyebrow = false }: { eyebrow?: boolean }) {
  return (
    <div className="flex flex-col gap-4 border-b pb-6">
      <div className="space-y-2">
        {eyebrow && <Skeleton className="h-4 w-20" />}
        <Skeleton className="h-9 w-56 sm:h-14 sm:w-80" />
        <Skeleton className="h-4 w-64" />
      </div>
    </div>
  );
}
