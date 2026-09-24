import { Skeleton } from "@v1/ui/skeleton";
import { PageHeaderSkeleton } from "@/components/page-header";
import { PageShell } from "@/components/page-shell";

export default function NewAuctionLoading() {
  return (
    <PageShell>
      <PageHeaderSkeleton eyebrow />
      <div className="space-y-12">
        {[0, 1, 2].map((step) => (
          <div key={step}>
            <div className="flex items-baseline gap-3 pb-4">
              <Skeleton className="h-4 w-6" />
              <Skeleton className="h-7 w-48" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
