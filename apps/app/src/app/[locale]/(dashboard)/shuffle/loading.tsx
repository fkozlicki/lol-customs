import { DrawSkeleton } from "@v1/ui/recipes/draw/draw-skeleton";
import { PageHeaderSkeleton } from "@v1/ui/recipes/page-header-skeleton";
import { PageShell } from "@v1/ui/recipes/page-shell";

export default function ShuffleLoading() {
  return (
    <PageShell>
      <PageHeaderSkeleton />
      <DrawSkeleton />
    </PageShell>
  );
}
